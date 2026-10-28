#include <endian.h>
#include <getopt.h>
#include <linux/limits.h>
#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <fcntl.h>
#include <string.h>
#include <unistd.h>
#include <sys/epoll.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <time.h>
#include <signal.h>

#define MAX_EVENTS 64
#define MAX_BUFF_SIZE 1024

typedef enum {
    OK              = 200,
    BAD_REQUEST     = 400,
    FORBIDDEN       = 403,
    NOT_FOUND       = 404,
    NOT_IMPLEMENTED = 501
} response_code;

const char* code_desc(response_code c) {
    switch (c) {
        case OK:                return "OK";
        case BAD_REQUEST:       return "Bad Request";
        case FORBIDDEN:         return "Forbidden";
        case NOT_FOUND:         return "Not Found";
        case NOT_IMPLEMENTED:   return "Not Implemented";
    }
    return NULL;
}

typedef enum {
    GET, POST, PUT, DELETE, INVALID
} req_method;

const char* req_method_desc(req_method m) {
    switch (m) {
        case GET:       return "GET";
        case POST:      return "POST";
        case PUT:       return "PUT";
        case DELETE:    return "DELETE";
        case INVALID:   return "INVALID";
    }
    return NULL;
}

static void set_nonblocking(int fd) {
    int flags = fcntl(fd, F_GETFL, 0);

    if (flags == -1) {
        perror("fcntl");
        exit(EXIT_FAILURE);
    }

    if (fcntl(fd, F_SETFL, flags | O_NONBLOCK) == -1) {
        perror("fcntl");
        exit(EXIT_FAILURE);
    }
}

char root[PATH_MAX];
volatile sig_atomic_t running = 1;

void sigint_handler(int) {
    running = 0;
}

const char* get_mime(const char* path) {
    const char* file_extension = NULL;
    while (*path != '\0' && *path != '?') {
        if (*path == '.') file_extension = path;
        ++path;
    }
    if (file_extension == NULL) return NULL;

    ++file_extension;
    const uint16_t length = path - file_extension;

    if (strncmp(file_extension, "html", length) == 0)   return "text/html";
    if (strncmp(file_extension, "css", length)  == 0)   return "text/css";
    if (strncmp(file_extension, "js", length)   == 0)   return "application/javascript";
    if (strncmp(file_extension, "jpg", length)  == 0)   return "image/jpeg";
    if (strncmp(file_extension, "jpeg", length) == 0)   return "image/jpeg";
    if (strncmp(file_extension, "png", length)  == 0)   return "image/png";
    if (strncmp(file_extension, "gif", length)  == 0)   return "image/gif";

    return "text/plain";
}

FILE* process_request(const char* buff, size_t n, req_method* method, response_code* code, char** res, size_t* res_n, char** path, size_t* file_size) {
    size_t i = 0;
    while (buff[i] != ' ' && i < n) ++i;
    
    *method = INVALID;
    *code = BAD_REQUEST;
    FILE* file = NULL;
    *file_size = 0;

    const char* type = "text/plain";

    if (i == 3) {
        if (strncmp(buff, "GET", 3) == 0) {
            *method = GET;

            while (buff[++i] == ' ');
            buff += i;

            i = 0;
            while (buff[++i] != ' ' && buff[i] != '?'); // Get whole url without parameters
            
            const size_t root_len = strlen(root);
            const size_t size = root_len + i + 1;
            char* sum = malloc(size);
            
            memcpy(sum, root, root_len);
            memcpy(sum + root_len, buff, i);
            sum[size - 1] = '\0';

            *path = malloc(size);
            if (realpath(sum, *path) == NULL) *code = NOT_FOUND;
            else if (strncmp(root, *path, root_len) == 0 && ((*path)[root_len] == '\0' || (*path)[root_len] == '/')) {
                if ((*path)[root_len] == '\0') { // requested root folder
                    *path = realloc(*path, root_len + 12); // "/index.html" -> 12
                    memcpy(*path, root, root_len);
                    strcpy(*path + root_len, "/index.html");
                }

                file = fopen(*path, "r");

                if (file != NULL) { 
                    struct stat fs;
                    fstat(fileno(file), &fs);
                    
                    if (S_ISREG(fs.st_mode)) {
                        *file_size = fs.st_size;
                        type = get_mime(*path);
                        *code = OK;
                    }
                    else {
                        fclose(file);
                        file = NULL;
                        *code = FORBIDDEN;
                    }
                }
                else *code = NOT_FOUND;
            }
            else *code = FORBIDDEN;

            //puts(sum);
            //puts(*path);            
            free(sum);
        }
        else if (strncmp(buff, "PUT", 3) == 0) {
            *method = PUT;
            *code = NOT_IMPLEMENTED;
        }
    }
    else if (i == 4 && strncmp(buff, "POST", 4) == 0) {
        *method = POST;
        *code = NOT_IMPLEMENTED;
    }
    else if (i == 6 && strncmp(buff, "DELETE", 6) == 0) {
        *method = DELETE;
        *code = NOT_IMPLEMENTED;
    }
    
    *res_n = snprintf(NULL, 0, 
            "HTTP/1.1 %u %s\r\n"
            "Content-Type: %s\r\n"
            "Content-Length: %zu\r\n"
            "Connection: close\r\n"
            "\r\n"
            , *code, code_desc(*code), type, *file_size);

    *res = malloc(*res_n);
    sprintf(*res, 
            "HTTP/1.1 %u %s\r\n"
            "Content-Type: %s\r\n"
            "Content-Length: %zu\r\n"
            "Connection: close\r\n"
            "\r\n"
            , *code, code_desc(*code), type, *file_size);

    return file;
}

int main(int argc, char** argv) {
    uint16_t port = 8080;
    char* dir = NULL;
    {
        uint32_t in_port = port;
        char* in_port_end;
    
        int option;
        while ((option = getopt(argc, argv, "p:d:")) != -1) {
            switch (option) {
                case 'p':
                    in_port = strtoul(optarg, &in_port_end, 10);
                    break;
                case 'd':
                    dir = optarg;
                    break;
            }
        }

        if (in_port > 0xFFFFu || *in_port_end != '\0') {
            fputs("Invalid port value\n", stderr);
            return -1;
        }
        else port = in_port;
    }

    if (dir == NULL) realpath(".", root);
    else if (realpath(dir, root) == NULL) {
        fputs("Invalid root value\n", stderr);
        return -2;
    }

    {
        struct stat st;
        if (stat(root, &st) == -1) {
            perror("stat");
            return -3;
        }
        if (!S_ISDIR(st.st_mode)) {
            fputs("Given root is not a directory\n", stderr);
            return -4;
        }

        if (access(root, R_OK | X_OK) == -1) {
            perror("access to root");
            return -5;
        }
    }

    signal(SIGINT, sigint_handler);

    const int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd == -1) {
        perror("socket failed");
        return 1;
    }
    
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons(port);//BYTE_ORDER == LITTLE_ENDIAN ? __builtin_bswap16(port) : port;
    addr.sin_addr.s_addr = INADDR_ANY;

    if (bind(server_fd, (struct sockaddr*)&addr, sizeof(addr)) == -1) {
        perror("bind failed");
        return 2;
    }

    if (listen(server_fd, SOMAXCONN) == -1) {
        perror("listen failed");
        return 3;
    }

    set_nonblocking(server_fd);

    printf("Listening on %hu; root: %s\n", port, root);

    // epoll
    const int epoll_fd = epoll_create1(0);
    if (epoll_fd == -1) {
        perror("epoll_create1");
        return 4;
    }

    struct epoll_event epoll_ev;
    epoll_ev.events = EPOLLIN;
    epoll_ev.data.fd = server_fd;

    if (epoll_ctl(epoll_fd, EPOLL_CTL_ADD, server_fd, &epoll_ev) == -1) {
        perror("epoll_ctl");
        return 5;
    }

    // loop
    struct epoll_event events[MAX_EVENTS];
    FILE* log_file = fopen("log", "a");

    while (running) {
        const int ready = epoll_wait(epoll_fd, events, MAX_EVENTS, -1);
        if (ready == -1) {
            perror("epoll_wait");
            break;
        }

        for (int i = 0; i < ready; ++i) {
            const int fd = events[i].data.fd;
            const time_t now = time(NULL);
            const struct tm *local = localtime(&now);

            if (fd == server_fd) {
                struct sockaddr_in client_addr;
                socklen_t client_len = sizeof(client_addr);

                const int client_fd = accept(server_fd, (struct sockaddr*)&client_addr, &client_len);
                if (client_fd == -1) {
                    perror("accept");
                    continue;
                }

                {
                    char ip[INET_ADDRSTRLEN];
                    inet_ntop(AF_INET, &client_addr.sin_addr.s_addr, ip, sizeof(ip));
                    //printf("New connection from %s\n", ip);
                }

                set_nonblocking(client_fd);
                
                struct epoll_event client_ev;
                client_ev.events = EPOLLIN;
                client_ev.data.fd = client_fd;

                epoll_ctl(epoll_fd, EPOLL_CTL_ADD, client_fd, &client_ev);
            }
            else {
                char buff[MAX_BUFF_SIZE];

                ssize_t n = recv(fd, buff, sizeof(buff), 0);
                
                if (n <= 0) {
                    //printf("Client %d disconnected.\n", fd);

                    epoll_ctl(epoll_fd, EPOLL_CTL_DEL, fd, NULL);
                    close(fd);
                }
                else {
                    //printf("Recieved from %d:\n%.*s\n", fd, (int)n, buff);

                    req_method method;
                    response_code code;
                    char *response, *file_path = NULL;
                    size_t res_size, file_size;
                    FILE* file = process_request(buff, n, &method, &code, &response, &res_size, &file_path, &file_size);
                    send(fd, response, res_size, 0);

                    {
                        flockfile(log_file);

                        struct sockaddr_in addr;
                        socklen_t len = sizeof(addr);
                        getpeername(fd, (struct sockaddr*)&addr, &len);

                        char ip[INET_ADDRSTRLEN];
                        inet_ntop(AF_INET, &addr.sin_addr.s_addr, ip, sizeof(ip));

                        fprintf(log_file, "%04d-%02d-%02d %02d:%02d:%02d %s %s %s %d\n", local->tm_year + 1900, local->tm_mon + 1, local->tm_mday, 
                                local->tm_hour, local->tm_min, local->tm_sec, ip, req_method_desc(method), file_path, code);
                        fflush(log_file);

                        funlockfile(log_file);
                    }

                    if (file != NULL) { 
                        uint8_t* file_buff = malloc(file_size);
                        fread(file_buff, 1, file_size, file);

                        size_t sent = 0;
                        while (sent < file_size) {
                            const ssize_t n = send(fd, file_buff + sent, file_size - sent, 0);
                            if (n == -1) perror("send");
                            else sent += n;
                        }

                        fclose(file);
                    }

                    free(response);
                    close(fd);
                }
            }
        }
    }
     
    close(epoll_fd);
    close(server_fd);
    fclose(log_file);
}

