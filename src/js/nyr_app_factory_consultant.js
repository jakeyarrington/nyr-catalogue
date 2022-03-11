appController.factory('consultant', function() {

    var ct_slug = is_local ? '/joannbrewer' : location.pathname.toLowerCase();
    var ct_region = ($.inArray(location.host.substring(0,2), ['uk','us']) > -1 ? location.host.substring(0,2) : 'us')
    var ct_config = false;

    if(ct_slug.indexOf('#') > -1) {
        var split = ct_slug.split('#');
        ct_slug = split[0];
    }
    
    // Remove slash
    if(ct_slug.substring(0,1) == '/') {
        ct_slug = ct_slug.substring(1, ct_slug.length);
    }


    // Check if configurator
    if(location.search.indexOf('?configure=1') > -1 || location.host.substring(0,9) == 'configure') {

        if(ct_slug == 'corp') {

            M.toast({
                html: ('You cannot configure the Corporate shop!'),
                displayLength: 2000
            });

        } else {
            ct_config = true;
        }

    }


    // Check for any segments
    if(ct_slug.indexOf('/') > -1) {
        ct_slug = ct_slug.split('/')[0];
    }

    if(ct_slug.length < 1) {
        ct_slug = 'corp';
    }

    var region = params.get('region') ? params.get('region') : ct_region;

    var http = new Promise((resolve, reject) => {
        $.ajax({
            url: cdn_url + '/consultant/' + ct_slug + (ct_slug == 'corp' ? '' : ('.' + region)) + '.json',
            type: 'GET',
            cache : false,
            processData: false,
            success: function(data) {

                var parsed_data = typeof data == 'object' ? data : JSON.parse(data);

                var manifest = {
                    dir: "ltr",
                    lang: "en",
                    name: parsed_data.name.full + "'s NYR Smart Catalogue",
                    short_name: parsed_data.name.full + "'s NYR Smart Catalogue",
                    scope: "https://"+parsed_data.region+".nyrcatalogue.com/" + parsed_data.slug,
                    display: "standalone",
                    start_url: "https://"+parsed_data.region+".nyrcatalogue.com/" + parsed_data.slug,
                    background_color: "#ffffff",
                    theme_color: "transparent",
                    description: "",
                    orientation: "natural",
                    icons: [{
                        src: "https://nyrcatalogue.com/assets/img/icon@128.png",
                        sizes: "128x128",
                        type: "image/png"
                    }, {
                        src: "https://nyrcatalogue.com/assets/img/icon@256.png",
                        sizes: "256x256",
                        type: "image/png"
                    }, {
                        src: "https://nyrcatalogue.com/assets/img/icon@144.png",
                        sizes: "144x144",
                        type: "image/png"
                    }],
                    url: "https://"+parsed_data.region+".nyrcatalogue.com/" + parsed_data.slug
                };

                const stringManifest = JSON.stringify(manifest);
                const blob = new Blob([stringManifest], {type: 'application/javascript'});
                const manifestURL = URL.createObjectURL(blob);
                document.querySelector('#manifest').setAttribute('href', manifestURL);

                //$('head').append('<link rel="manifest" href="' + cdn_url + 'consultant/' + ct_slug + '_manifest.json"/>');
                resolve(data)
            },
            error: function(error) {
                try {
                    console.log('error not exists');
                    reject(error);
                } catch(e) {
                    console.log('this consultant does not exist');
                    reject(error);
                }
            },
        });
    });

    var response = {
        http: http,
        data: null,
        url_slug: ct_slug,
        configurator: ct_config,
        loaded: false,
        cached: false,
        set: function(data) {
            var $this = response;

            if (this.loaded) {
                return this;
            }

            this.data = typeof data == 'string' ? JSON.parse(data) : data;

            /* 
             * Correct all social media links
             */
            if(typeof this.data.social !== 'undefined') {
                var social_keys = Object.keys(this.data.social);
                for (var i = social_keys.length - 1; i >= 0; i--) {
                    var key = social_keys[i];

                    if(this.data.social[key]) {
                       this.data.social[key] = 'https://' + this.data.social[key].replace('https://', '').replace('http://', ''); 
                    }
                }
            }

            /*
             * Set Default Welcome Message
             */
            if(typeof this.data.welcome_message !== 'undefined' && !this.data.welcome_message) {
                this.data.welcome_message = default_welcome_message;
            } else {
                this.data.welcome_message = this.data.welcome_message.replace(/<\s*\/?br\s*[\/]?>/gim, "\n");
            }

            /*
             * Toggle Welcome Message
             */

            if(typeof this.data.welcome_message !== 'undefined' && this.data.welcome_message && !this.configurator) {
                if(this.data.slug !== 'corp') {
                    var seen_before_key = this.data.slug + '_welcome_msg';
                    if(!localStorage.getItem(seen_before_key)) {
                        localStorage.setItem(seen_before_key, 1);
                        M.Modal.getInstance($('#welcome')).open();
                    }
                }
            }

            this.loaded = true;
            this.http = {
                then: function() {
                    $this.data.cached = true;
                    return $this.data;
                }
            };

            return this;
        },
        get: function() {
            var $this = response;
            return $this.data;
        }
    };

    return response;

});