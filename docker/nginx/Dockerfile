FROM nginx:1.20.0-alpine

ARG GROUP_ID
ARG USER_ID

RUN addgroup -g $GROUP_ID -S dockeruser

RUN adduser -S -G dockeruser -u $USER_ID -s /bin/ash dockeruser

RUN chown -R dockeruser:dockeruser /var/cache/nginx

RUN chmod -R 770 /var/cache/nginx

RUN touch /var/run/nginx.pid

RUN chown -R dockeruser:dockeruser /var/run/nginx.pid

COPY ./docker/nginx/default.conf /etc/nginx/conf.d/default.conf

COPY ./demo/ /home/dockeruser/zoom/

COPY ./zoom-by-ironex.min.js /home/dockeruser/zoom/js/zoom-by-ironex.min.js

RUN chown -R dockeruser:dockeruser /home/dockeruser/zoom

USER dockeruser