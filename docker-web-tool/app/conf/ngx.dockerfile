FROM nginx

# Add user to a group
RUN usermod -aG www-data nginx
