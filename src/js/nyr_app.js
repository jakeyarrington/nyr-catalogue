
window.deferredPrompt;
function install_app() {
    window.deferredPrompt.prompt();
    outcome= deferredPrompt.userChoice;
}

(function($) {

    var pages = [];
    var page_index = 0;
    var app = angular.module('nyr', ['ngSanitize']);
    var seen_exit_intent = false;

    const is_local = location.href.indexOf('192.168') > -1 || location.href.indexOf('localhost') > -1;
    const api_url = 'https://nyr-catalogue-wp.yarrington.app/wp-json/app/v1/';
    const cdn_url = is_local ? 'http://192.168.0.88:8080/mockdata/' : 'https://yarrington-objects.fra1.cdn.digitaloceanspaces.com/nyr/catalogue/';
    const base_url = location.protocol + '//' + location.host;

    const basket_sidebar = document.getElementById('basket_sidebar');
    const favourites_sidebar = document.getElementById('favourites_sidebar');
    const options_modal = document.getElementById('options');

    
    window.can_install_app = false;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
        window.can_install_app = true;
        console.log(e, can_install_app);
    });


    var appController = app.controller('app', ['$scope', 'catalogues', 'consultant', '$timeout', function($scope, catalogues, consultant, $timeout) {

        $scope.page_index = 0;
        window.scope = $scope;
        window.catalogues = catalogues;
        window.consultant = consultant;

        $scope.install_app = function() {
            install_app();
        };

        $scope.consultant_query = {
            loading: false,
            id: '',
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            url: '',
            region: 'uk',
            app_launch: 'catalogue',
            twitter: '',
            facebook: '',
            instagram: '',
            linkedin: '',
            pinterest: ''
        };

        $scope.consultant_party_codes = [
            {code: ''}
        ];

        $scope.save_party_codes = function() {
             M.toast({
                html: ('Saving Party Links, please wait...'),
                    displayLength: 1000,
            });

            $.ajax({
                url: api_url + 'party_links',
                type: 'POST',
                data: {
                    codes: $scope.consultant_party_codes,
                    slug: consultant.data.slug
                },
            })
            .done(function(e) {
                console.log(e);
                $timeout(function() {
                    $scope.consultant_party_codes = [];
                });
                // M.Modal.getInstance($('#configurator')).close();
                M.toast({
                    html: (e.msg),
                    displayLength: 6000,
                });
            })
            .fail(function() {
                M.toast({
                    html: 'An error occurred! Please try again',
                    displayLength: 2000,
                });
            });
        }


        $scope.add_party_code = function() {
            $scope.consultant_party_codes.push({
                code: ''
            });
            $timeout(function() {
                M.updateTextFields();
            }, 500);
        };

        $scope.close_modal = function($id) {
            M.Modal.getInstance($($id)).close();
        }


        $scope.favourite = {
            $data: {},
            $count: 0,
            update: function($key, $state) {
                var that = this;
                var key = $key;
                if(!isNaN($state)) {
                    localStorage.setItem(key, $state);
                }

                if($state < 1) {
                    localStorage.removeItem(key);
                }

                $timeout(function() {
                    that.get_all();
                    $scope.$apply();
                });
                

                return localStorage.getItem($key);
            },
            get_all: function() {

                var that = this;

                this.$data = {};
                this.$count = 0;
                var ls_keys = Object.keys(localStorage);

                for (var i = ls_keys.length - 1; i >= 0; i--) {
                    var key = ls_keys[i];
                    if(key.substring(0, 4) == 'nyr_') {
                        that.$data[key] = parseInt(localStorage.getItem(key));
                        that.$count++;
                    }
                }

                $timeout(function() {
                    $scope.$apply();
                });
            },
            get: function($key) {
                return this.update($key);
            },
            set: function($key, $value) {
                M.toast({
                    html: ('You have ' + ($value == 1 ? 'favourited' : 'unfavourited') + ' ' + catalogues.pages.data.items[$key].item.name + ' <button class="btn-flat toast-action" onclick="M.Sidenav.getInstance(favourites_sidebar).open()">View</button>').replace('%', length),
                    displayLength: 5000,
                });
                return this.update($key, $value);
            },
            remove: function($key) {
                this.update($key, -1);
            }

        }

        $scope.launch_configurator = function(redirect) {
            $scope.consultant_query.loading = true;

            

            $scope.save_configurator = function() {

                M.toast({
                html: ('Saving Configuration, please wait...'),
                    displayLength: 1000,
                });

                $.ajax({
                    url: api_url + 'configurator',
                    type: 'POST',
                    data: $scope.consultant_query,
                })
                .done(function(e) {
                    M.Modal.getInstance($('#configurator')).close();
                    M.toast({
                        html: (e.msg),
                        displayLength: 6000,
                    });
                    $timeout(function() {

                        if(redirect == true) {
                            location.href = '/';
                        }

                    }, 5000);
                })
                .fail(function() {
                    M.toast({
                        html: 'An error occurred! Please try again',
                        displayLength: 2000,
                    });
                });
                

            };

            var get_consultant_data = new Promise((resolve, reject) => {

                var slug = consultant.data !== null ? consultant.data.slug : consultant.url_slug;

                $.ajax({
                    url: api_url + 'configurator?id=' + slug,
                    type: 'GET',
                    success: function(data) {
                        resolve(data)
                    },
                    error: function(error) {
                         M.toast({
                            html: ('Could not find Consultant on NYR Organic'),
                            displayLength: 2000
                        });
                        reject(error)
                    },
                });

            });

            get_consultant_data.then(
                (data) => {
                    $timeout(function() {
                        if(!data.success) {
                            M.Modal.getInstance($('#configurator')).close();
                            location.href = '/';
                        } else {

                        // M.toast({
                        //     html: ('This consultant is not yet setup on NYR Catalogue, launching configurator...'),
                        //     displayLength: 2000
                        // });
                        M.Modal.getInstance($('#configurator')).open();


                        seen_exit_intent = true;

                        var region = data.data.id.substring(0,2).toLowerCase();

                        $scope.consultant_query = {
                            first_name: data.data.fname,
                            last_name: data.data.lname,
                            slug: consultant.url_slug,
                            loading: false,
                            id: data.data.id,
                            email: data.data.email,
                            phone: data.data.phone,
                            region: region,
                            url: 'https://' + $scope.consultant_query.region + '.nyrorganic.com/shop/' + consultant.url_slug,
                            app_launch: 'catalogue',
                            twitter: data.data.twitter ? data.data.twitter : '',
                            facebook: data.data.facebook ? data.data.facebook : '',
                            instagram: '',
                            linkedin: '',
                            pinterest: ''
                        };
                    }

                        $scope.$apply();
                    });
                },
                (data) => {
                    console.log(data);
                    M.Modal.getInstance($('#configurator')).close();
                    M.toast({
                    html: ('Could not find Consultant!'),
                        displayLength: 2000,
                    });
                }
            );
        }

        consultant.http.then((e) => {

            /* Store Data */
            consultant.set(e);  

            $scope.consultant = consultant.get();
                
            /**
             * Consultant has been loaded 
             */

            if(consultant.configurator) {
                M.toast({
                html: ('Launching Configurator, please wait..'),
                    displayLength: 1000,
                    completeCallback: function() {
                        $scope.launch_configurator(false);
                    }
                });
                
            }


            catalogues.http.then((e) => {

                var region = typeof $scope.consultant.region !== 'undefined' ? $scope.consultant.region : 'uk';

                /* Store Data */
                catalogues.region = region;
                catalogues.set(e, consultant);

                $scope.catalogue_url = location.href;

                $timeout(function() {
                    $scope.catalogue = catalogues;
                    $scope.consultant = consultant;
                    $scope.$apply();
                });

                $scope.open_video_modal = function($item) {
                    $timeout(function() {
                        catalogues.modal = $item;
                        $scope.$apply();
                    });
                };

                $scope.prep_product_url = function($url) {
                    if(typeof $scope.catalogue == 'object' && $scope.catalogue.party !== null) {
                        var glue = '?';
                        if($url.indexOf(glue) > -1) {
                            glue = '&';
                        }

                        $url = $url + glue + 'bid=' + $scope.catalogue.party.bid + '&po=' + $scope.catalogue.party.id; 
                    }

                    return $url;
                }

                $scope.mail_favourites = function() {
                    var link = 'mailto:' + $scope.consultant.data.email;
                    link += '?subject=My%20Favourites%20List&cc=&bcc=&body=';
                    var body = 'Hi ' + $scope.consultant.data.name.first_name + ', I am interested in purchasing the following products.';
                    body += "\n\n";
                    var favourite_keys = Object.keys($scope.favourite.$data);
                    for (var i = favourite_keys.length - 1; i >= 0; i--) {
                        var key = favourite_keys[i];
                        var product = $scope.catalogue.pages.data.items[key];
                        body += '- ' + product.item.name + ' (' + product.price + ')';
                        body += "\n";
                    }

                    body += "\n";
                    body += 'Kind regards,';
                    body += "\n";

                    body = encodeURI(body);

                    location.href = link + body;
                }


                /* Init Flipbook */
                $scope.pdf_url = cdn_url + (catalogues.get()[region + '_pdf_file']);
                $scope.flipbook = $('.solid-container').FlipBook({
                    pdf: $scope.pdf_url
                });

                $timeout(function() {
                    $scope.favourite.get_all();
                    $scope.$apply();
                });

                function bindIFrameMousemove(iframe){
                    iframe.contentWindow.addEventListener('mousemove', function(event) {
                        var clRect = iframe.getBoundingClientRect();
                        var evt = new CustomEvent('mousemove', {bubbles: true, cancelable: false});

                        evt.clientX = event.clientX + clRect.left;
                        evt.clientY = event.clientY + clRect.top;

                        iframe.dispatchEvent(evt);
                    });
                };

                bindIFrameMousemove($('.solid-container iframe')[0]);

                $('body').on('mousemove', function(e) {
                    if(e.clientY <= 15 && (e.clientX < (window.innerWidth/3)) && !seen_exit_intent) {
                        M.Modal.getInstance(options_modal).open();
                        seen_exit_intent = true;
                    }
                });

                /* Setup loop for Page Change */
                setTimeout(function() {
                    // $scope.favourite.get_all();

                    $scope.can_install_app = window.can_install_app;
                    if(window.can_install_app && !window.matchMedia('(display-mode: standalone)').matches) {
                        M.toast({
                            html: ('Install ' + $scope.consultant.data.name.first_name + '\'s App? <button class="btn-flat toast-action" onclick="install_app()">Install</button>'),
                            displayLength: 30000,
                        });
                    }
                }, 1000);
                setInterval(function() {

                    if (typeof $scope.flipbook.book == 'undefined') {
                        return;
                    } else {
                        $('.loading-page').remove();
                    }

                    $scope.this_page_index = $scope.flipbook.book.getPage() + 1;
                    if ($scope.this_page_index !== $scope.page_index) {
                        $scope.page_index = $scope.this_page_index;

                        $timeout(function() {
                            catalogues.active_page = $scope.this_page_index;
                            $scope.$apply();
                        });

                        console.log('Page Index', $scope.page_index);

                        /* We're on the last page */
                        if($scope.page_index == $scope.flipbook.book.getBookPages()) {
                            M.Modal.getInstance(options_modal).open();
                        }

                        if (typeof catalogues.pages.data.order[$scope.page_index] !== 'undefined') {

                            $scope.active_items = catalogues.pages.data.order[$scope.page_index];
                            var length = catalogues.pages.data.order[$scope.page_index].length;

                            M.toast({
                                html: ('There ' + (length == 1 ? 'is' : 'are') + ' % item' + (length == 1 ? '' : 's') + ' to view <button class="btn-flat toast-action" onclick="M.Sidenav.getInstance(basket_sidebar).open()">View</button>').replace('%', length),
                                displayLength: 5000,
                            });
                        }

                    }

                }, 100);

            }, (e) => {
                console.warn('error loading catalogue', e);
            });

        }, (e) => {
            
                $scope.launch_configurator(true);
        });

        

    }]);


    appController.factory('consultant', function() {

        var ct_slug = is_local ? '/shropshireorganic' : location.pathname;
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
        if(location.search.indexOf('?configure=1') > -1) {

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



        var http = new Promise((resolve, reject) => {
            $.ajax({
                url: cdn_url + 'consultant/' + ct_slug + '.json',
                type: 'GET',
                success: function(data) {
                    $('head').append('<link rel="manifest" href="' + cdn_url + 'consultant/' + ct_slug + '_manifest.json"/>');
                    resolve(data)
                },
                error: function(error) {
                    try {
                        reject(error);
                    } catch(e) {
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

    appController.factory('catalogues', function() {

        var http = new Promise((resolve, reject) => {
            $.ajax({
                url: cdn_url + 'catalogue.json',
                type: 'GET',
                success: function(data) {
                    resolve(data)
                },
                error: function(error) {
                    reject(error)
                },
            });
        });

        var response = {
            http: http,
            data: null,
            party: null,
            loaded: false,
            active_page: 0,
            modal: [],
            region: 'uk',
            pages: {
                data: [],
                map: function() {
                    var $this = response;
                    var catalogue = $this.get();
                    var items = catalogue[$this.region + '_items'];
                    $this.pages.data = items;
                }
            },
            set: function(data, consultant) {
                var $this = response;

                if (this.loaded) {
                    return this;
                }

                if(typeof data !== 'string') {
                    data = JSON.stringify(data);
                }


                if(typeof consultant == 'object' && typeof consultant.data.slug == 'string') {
                    data = data.replace(/\/corp\//gm, '/' + consultant.data.slug + '/');
                    data = data.replace(/\\\/corp\\\//gm, '/' + consultant.data.slug + '/');
                    data = data.replace(/\/corp/gm, '/' + consultant.data.slug);
                    data = data.replace(/\/corp\\\//gm, '/' + consultant.data.slug + '/');

                    /*
                     * Check if there is a Party URL
                     */
                    if(location.search.indexOf('?party') > -1) {
                        var party_code = location.search.replace('?party=', '');
                        if(party_code.indexOf('&') > -1) {
                            party_code = $.trim(party_code.split('&')[0]);

                            if(typeof consultant.data == 'object' && typeof consultant.data.party_links == 'object') {
                                if(typeof consultant.data.party_links[party_code] !== 'undefined') {
                                    var party = consultant.data.party_links[party_code];
                                    party.id = party_code;

                                    if(party.name) {
                                        M.toast({
                                            html: ('You have joined ' + party.name + '\'s Party'),
                                            displayLength: 2000
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                this.data = JSON.parse(data);

                if(typeof party !== 'undefined') {
                    this.party = party;
                }

                this.loaded = true;
                this.pages.map();
                this.http = {
                    then: function() {
                        $this.data.cached = true;
                        return $this.data;
                    }
                };

                return this;
            },
            get: function(index) {
                var $this = response;
                return $this.data[index ? index : 0];
            }
        };

        return response;

    });

    app.filter('safeHtml', function($sce) {
        return function(val) {
            return $sce.trustAsHtml(val);
        };
    });

    $(document).ready(function() {
        $('.sidenav').sidenav();
        $('.tooltipped').tooltip();
        $('.modal').modal();
        $('.chips').chips();
        $('select').formSelect();
        $('.tabs').tabs();
    });

})(jQuery);