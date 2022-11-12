FROM php:7-fpm

ARG USER
ARG GROUP
ARG GID
ARG UID

# Install PHP extensions and PECL modules.
RUN buildDeps=" \
    default-libmysqlclient-dev \
    libbz2-dev \
    libmemcached-dev \
    libsasl2-dev \
    " \
    runtimeDeps=" \
    curl \
    git \
    libfreetype6-dev \
    libicu-dev \
    libjpeg-dev \
    libldap2-dev \
    libmemcachedutil2 \
    libpng-dev \
    libpq-dev \
    libxml2-dev \
    " \
    && printf "\n\e[7;36m %s \e[0m \e[2;36m%s\e[0m\n\n" "PHP" "Install Dependencies" \
    && apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y $buildDeps $runtimeDeps \
    && docker-php-ext-install bcmath bz2 calendar iconv intl mbstring mysqli opcache pdo_mysql pdo_pgsql pgsql soap zip \
    && docker-php-ext-configure gd --with-freetype-dir=/usr/include/ --with-jpeg-dir=/usr/include/ \
    && docker-php-ext-install gd \
    && docker-php-ext-configure ldap --with-libdir=lib/x86_64-linux-gnu/ \
    && docker-php-ext-install ldap \
    && docker-php-ext-install exif \
    && pecl install memcached \
    && docker-php-ext-enable memcached.so \
    && apt-get purge -y --auto-remove $buildDeps \
    && rm -r /var/lib/apt/lists/* \
    \
    && printf "\n\e[7;36m USER \e[0m: '\e[2;36m%s\e[0m(%s):\e[2;36m%s\e[0m(%s)'\n\n" "${USER}" "${UID}" "${GROUP}" "${GID}" \
    && groupadd --gid $GID -o $GROUP \
    && useradd --create-home --uid $UID --gid $GID --non-unique --shell /bin/bash $USER \
    && usermod -aG $GROUP $USER
