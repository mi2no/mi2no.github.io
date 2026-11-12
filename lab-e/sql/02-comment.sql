create table comment
(
    id      integer not null
        constraint comment_pk
            primary key autoincrement,
    post_id integer not null
        constraint comment_post_fk
            references post (id)
            on delete cascade,
    author  text    not null,
    content text    not null
);
