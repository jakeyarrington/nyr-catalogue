
const is_ios_safari = (() => {
var userAgent = window.navigator.userAgent.toLowerCase();
return /iphone|ipad|ipod|macintosh/.test(userAgent) && navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
    navigator.userAgent &&
    navigator.userAgent.indexOf('CriOS') === -1 &&
    navigator.userAgent.indexOf('FxiOS') === -1;
})();

window.deferredPrompt;
function install_app() {
    // M.Toast.dismissAll();
    if(is_ios_safari) {
        M.Modal.getInstance($('#install_app_ios')).open();
    } else {
        window.deferredPrompt.prompt();
        outcome= deferredPrompt.userChoice;  
    }
    
}

if(document.referrer.indexOf('configure.nyrcatalogue.com') > -1) {
    console.info('Clearing Service Workers to reset Configurator..');
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister();
        } 
    });
}

(function($) {

    var pages = [];
    var page_index = 0;
    var app = angular.module('nyr', ['ngSanitize']);
    var seen_exit_intent = false;

    const is_local = location.href.indexOf('192.168') > -1 || location.href.indexOf('localhost') > -1;
    const api_url = 'https://app.nyrcatalogue.com/wp-json/app/v1/';
    const cdn_url = is_local ? 'https://app.nyrcatalogue.com/data' : '/app/data';
    const base_url = location.protocol + '//' + location.host;
    const default_welcome_message = 'Hello. Welcome to my catalogue. I hope you enjoy viewing our range of amazing products. Please do let me know if you need any help or advice. I\'d be happy to make any recommendations. Feel free to contact me using any of the options available in the contact panel.';

    const basket_sidebar = document.getElementById('basket_sidebar');
    const favourites_sidebar = document.getElementById('favourites_sidebar');
    const options_modal = document.getElementById('options');
                                    

    const params = new URLSearchParams(location.search);

    
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

        $scope._consultant = consultant;

        $scope.install_app = function() {
            install_app();
        };

        $scope.htmlencode = function($str) {
            return $str.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
              return '&#' + i.charCodeAt(0) + ';';
            });
        }

        $scope.get_consultant_region = function($add_dot) {

            var prefix_region = location.host.substring(0,2).toLowerCase();

            if(is_local) {
                prefix_region = 'uk';
            }

            if(prefix_region == 'uk' || prefix_region == 'us') {
                return prefix_region + ($add_dot ? '.' : '');
            }

            var region = (params.get('region') ? (params.get('region').toLowerCase()) : ($scope.consultant !== undefined ? $scope.consultant.data.region : $scope.consultant_query.region));

            return region ? ($add_dot ? (region + '.') : region) : '';
        };

        $scope.my_shop_url = '';
        $scope.my_shop_slug = '';
        $scope.my_shop_region = '';
        $scope.my_shop_is_valid = false;
        $scope.validate_my_shop_url = function() {

            $('#setup_smart_catalogue a.continue').attr('disabled', 'disabled');

            var url = $.trim($scope.my_shop_url.toLowerCase());
            if(!url.length) {
                return;
            }

            if(url.substring(url.length-1, url.length) == '/') {
                url = url.substring(0, url.length-1);
            }

            if(url.indexOf('nyrorganic.com/shop') > -1) {
                var url_parts = url.split('/');
                var shop_name = url_parts[url_parts.length-1];
                if(typeof shop_name !== 'undefined') {
                    shop_name = $.trim(shop_name);

                    $scope.my_shop_region = url.indexOf('us.') > -1 ? 'us' : 'uk';
                    $scope.my_shop_slug = shop_name;

                    $scope.my_shop_is_valid = -1;

                    $scope.get_nyr_profile($scope.my_shop_slug, $scope.my_shop_region, (e) => {
                        $scope.my_shop_is_valid = e.success ? e.data : -2;
                        $timeout(() => { $scope.$apply(); });
                    }, (e) => {
                        $scope.my_shop_is_valid = -2;
                        $timeout(() => { $scope.$apply(); });
                    });

                    //$('#setup_smart_catalogue a.continue').removeAttr('disabled');
                }
            }

        }

        $scope.guide = function($modal) {
            var modals = [
                '#root_setup',
                '#setup_smart_catalogue',
                '#setup_smart_catalogue_confirm'
            ];

            for (var i = modals.length - 1; i >= 0; i--) {
                M.Modal.getInstance($(modals[i])).close();
            }

            M.Modal.getInstance($($modal)).open();
        };

        $scope.start_tutorial = function() {
            M.Modal.getInstance($('#root_setup')).close();
            introJs().setOptions({
              steps: [{
                intro: "In the center of your screen is the catalogue viewer, here you can view the latest Catalogue from NYR. You can drag the bottom right of the catalogue page to flip between pages.",
              }, 
              {
                element: $('#toast-container')[0],
                intro: "At the top right of your screen are notification popups, these will either tell your customers if there are items available to view or other important notifications."
              },
              {
                element: $('nav div.nav-wrapper')[0],
                intro: "This is the Sidebar which lists out all available links whilst your customers are browsing the Catalogue."
              },
              {
                element: $('#nav-mobile li:nth-child(1)')[0],
                intro: "The NYR Organic logo links your customers directly to your NYR Organic shop at any time."
              },
              {
                element: $('#nav-mobile li:nth-child(2)')[0],
                intro: "This is the Available Item viewer. When your customers are browsing the catalogue, any items that are available in the page will appear as a sidebar slide out when this button is selected. You can see that there are some items available to view on this page. Let's go ahead and open the sidebar.."
              },
              
              {
                element: $('#basket_sidebar')[0],
                intro: "Here we can see all available products that are displayed within the catalogue page. We can show and hide this sidebar at any time by clicking outside of it."
              },
              {
                element: $('#basket_sidebar > li:first-child header')[0],
                intro: "Here we can see the total amount of items to see on this page, we can also choose to sort them alphabetically or reverse alphabetically."
              },
              {
                element: $('#basket_sidebar > li:nth-child(2)')[0],
                intro: "Each item is displayed as a card, showing the product image, title, description price and links to either favourite or view."
              },
              {
                element: $('#basket_sidebar > li:nth-child(2)')[0],
                intro: "Clicking View on an item will take your customers directly to the product page on your NYR Organic shop."
              },
              {
                element: $('#basket_sidebar > li:nth-child(2)')[0],
                intro: "Favouriting an item adds it to your Favourites list, let's go ahead and favourite this one."
              },
              {
                element: $('#toast-container')[0],
                intro: "You will receive a notification at the top right telling you that an item has been added or removed from your Favourites"
              },
              {
                element: $('a[data-target="favourites_sidebar"]')[0],
                intro: "This button is where all of the items you have favourited are kept, you can see that the total number of favourites are displayed above the icon. Let's open your favourites now."
              },
              {
                element: $('#favourites_sidebar')[0],
                intro: "This is your Favourites list, here we list all of the items you have favourited."
              },
              {
                element: $('#favourites_sidebar div[ng-show="favourite.$count"]')[0],
                intro: "Your customers can send their favourites directly to you in an email for convenience."
              },
              {
                element: $('#favourites_sidebar li:nth-child(2) div.col.s12')[0],
                intro: "Your customers can view an item directly from within the Favourites list or remove them."
              },
              {
                element: $('a[data-tooltip="Share Catalogue"]')[0],
                intro: "This is Share Catalogue button, here your customers can share your Smart Catalogue over multiple Social Media platforms."
              },
              {
                element: $('a[data-tooltip="Contact Consultant"]')[0],
                intro: "This is the Contact Consultant button which lets your customers contact you directly as well as install your app and other useful links."
              },
              {
                intro: "You have now reached the end of the tutorial, you can now setup your own Smart Catalogue or play with the functionality in this one."
              }
            ]
            })
            .onexit(function() {
              M.Modal.getInstance($('#root_setup')).open();
            })
            .onchange(function(targetElement) {  
                var step = this._currentStep;
                console.log(step);
                if(step == 1) {
                    var cat = $scope.catalogue.get();
                    var items = cat[$scope.consultant.data.region + '_items'].items;
                    var first_item = Object.keys(items)[0];
                    var page = items[first_item].page;

                    $scope.flipbook.ctrl.goToPage(page);
                }
                if(step == 5) {
                    M.Sidenav.getInstance($('#basket_sidebar')).open();
                }
                if(step == 10) {
                    var cat = $scope.catalogue.get();
                    var items = cat[$scope.consultant.data.region + '_items'].items;
                    var first_item = Object.keys(items)[0];
                    $scope.favourite.set(items[first_item].id, 1);
                }
                if(step == 11) {
                    M.Sidenav.getInstance($('#basket_sidebar')).close();
                }
                if(step == 12) {
                    M.Sidenav.getInstance($('#favourites_sidebar')).open();
                }
                if(step == 15) {
                    M.Sidenav.getInstance($('#favourites_sidebar')).close();
                }
            }).start();
        };

        $scope.sort_items = function($order) {

            if(!$scope.active_items.length) {
                return;
            }

            if($order == 'default') {
                $timeout(() => {

                    $scope.active_items.sort(function(a, b){
                      if(a.id > b.id) return -1;
                      if(a.id < b.id) return 1;
                      return 0;
                    });

                    $scope.$apply();

                });
            }

            if($order == 'az') {
                $timeout(() => {

                    $scope.active_items.sort(function(a, b){
                      if(a.item.name < b.item.name) return -1;
                      if(a.item.name > b.item.name) return 1;
                      return 0;
                    });

                    $scope.$apply();

                });
            }

            if($order == 'za') {
                $timeout(() => {

                    $scope.active_items.sort(function(a, b){
                      if(a.item.name > b.item.name) return -1;
                      if(a.item.name < b.item.name) return 1;
                      return 0;
                    });

                    $scope.$apply();

                });
            }
        }

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
            pinterest: '',
            welcome_message: default_welcome_message,
            whatsapp: '',
            newsletter: ''
        };

        $scope.view_product = function($item) {
            $timeout(() => {
                $scope.active_product = $item;
                $scope.$apply();
                M.Modal.getInstance($('#moreinfo')).open();
            });
        }

        $scope.hide_party_links = false;

        $scope.consultant_party_codes = [
            {code: ''}
        ];

        $scope.saving_party_codes = false;

        $scope.save_party_codes = function() {
             M.toast({
                html: ('Saving Party Links, please wait...'),
                    displayLength: 1000,
            });

            $scope.saving_party_codes = true;

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
                    $scope.consultant_party_codes = [
                        {code: ''}
                    ];
                    $scope.$apply();
                });
                // M.Modal.getInstance($('#configurator')).close();
                M.toast({
                    html: (e.msg),
                    displayLength: 6000,
                    completeCallback: function() {
                        $timeout(() => {
                            $scope.saving_party_codes = false;
                            $scope.$apply();
                        });
                        M.Modal.getInstance($('#configurator')).close();
                        M.toast({
                            html: 'Exiting Configurator',
                            displayLength: 3000,
                            completeCallback: function() {
                                $scope.goto_consultant_home();
                            }
                        });
                    }
                });
            })
            .fail(function() {
                M.toast({
                    html: 'An error occurred! Please try again',
                    displayLength: 2000,
                });
            })
            .always(function() {
                $timeout(function() {
                    $scope.saving_party_codes = true;
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
                        if($scope.catalogue.pages.data.items[key]) {
                            that.$data[key] = parseInt(localStorage.getItem(key));
                            that.$count++;
                        } else {
                            localStorage.removeItem(key);
                        }
                        
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

        $scope.get_consultant_url = function() {
            var region = $scope.get_consultant_region(false);
            return 'https://' + region + '.nyrcatalogue.com/' + $scope.consultant_query.slug;
        };

        $scope.goto_consultant_home = function() {

            var region = $scope.get_consultant_region(true);
            if(!region) {
                region = '';
            }

            return location.href = base_url.replace('configure.',region) + '/' + $scope.consultant_query.slug;
        };

        $scope.get_nyr_profile = function($slug, $region, $success, $error) {
            var url = api_url + 'configurator?id=' + $slug + ($region ? ('&region=' + $region) : '');
            $.ajax({
                url: url,
                type: 'GET',
                success: function(data) {
                    $success(data)
                },
                error: function(error) {
                    $error(error)
                },
            });
        };

        $scope.launch_configurator = function(redirect) {
            $scope.consultant_query.loading = true;

            M.updateTextFields();

            $scope.save_configurator = function() {

                M.toast({
                html: ('Saving Configuration, please wait...'),
                    displayLength: 1000,
                });

                $scope.consultant_query.welcome_message = $scope.consultant_query.welcome_message.replace(/(\r\n|\n|\r)/gm, '<br>').replace(/\n/gm, '<br/>');

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
                        completeCallback: function() {
                            M.toast({
                                html: 'Exiting Configurator',
                                displayLength: 3000,
                                completeCallback: function() {
                                    $scope.goto_consultant_home();
                                }
                            });
                        }
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

                $scope.get_nyr_profile(slug, false, (e) => {

                    resolve(e);

                }, (e) => {
                    M.toast({
                        html: ('Could not find Consultant on NYR Organic'),
                        displayLength: 2000
                    });

                    reject(e);
                });

            });

            get_consultant_data.then(
                (data) => {
                    $timeout(function() {

                        if($scope.consultant !== undefined) {
                            if($scope.consultant.data.slug == 'corp') {
                                return;
                            }
                        } 

                        if(!data.success) {
                            M.Modal.getInstance($('#configurator')).close();
                            console.log('Consultant does not exist on NYR');
                            $scope.consultant_query.loading = false;
                            $('.loading-page').remove();
                            $('nav.main-nav').addClass('hide');
                            M.Modal.getInstance($('#consultant_not_exists')).open();

                            // location.href = '/';
                        } else {

                        // M.toast({
                        //     html: ('This consultant is not yet setup on NYR Catalogue, launching configurator...'),
                        //     displayLength: 2000
                        // });
                        M.Modal.getInstance($('#configurator')).open();


                        $scope.seen_exit_intent = true;

                        var region = data.data.id.substring(0,2).toLowerCase();

                        $scope.consultant_query = {
                            first_name: data.data.fname,
                            last_name: data.data.lname,
                            slug: consultant.url_slug,
                            loading: false,
                            id: data.data.id,
                            email: data.data.email,
                            phone: data.data.phone ? data.data.phone : '',
                            region: region,
                            url: 'https://' + data.data.id.substring(0,2).toLowerCase() + '.nyrorganic.com/shop/' + consultant.url_slug,
                            app_launch: 'catalogue',
                            twitter: data.data.twitter ? ('https://' + data.data.twitter.replace('https://', '')) : '',
                            facebook: data.data.facebook ? ('https://' + data.data.facebook.replace('https://', '')) : '',
                            instagram: '',
                            linkedin: '',
                            pinterest: '',
                            welcome_message: (typeof data.data.welcome_message !== 'undefined' ? data.data.welcome_message.replace(/<\s*\/?br\s*[\/]?>/gim, "\n") : default_welcome_message)
                        };



                        /*
                         * Replace details with JSON data
                         */
                        if($scope.consultant !== undefined && typeof $scope.consultant.data == 'object') {

                            var named_keys = Object.keys($scope.consultant.data);
                            for (var i = named_keys.length - 1; i >= 0; i--) {
                                var key = named_keys[i];
                                if(typeof $scope.consultant.data[key] !== 'object') {

                                    if(key == 'welcome_message') {
                                        $scope.consultant.data[key] = $scope.consultant.data[key].replace(/<\s*\/?br\s*[\/]?>/gim, "\n");
                                    }

                                    $scope.consultant_query[key] = $scope.consultant.data[key];
                                }
                            }

                            var social_keys = Object.keys($scope.consultant.data.social);
                            for (var i = social_keys.length - 1; i >= 0; i--) {
                                var key = social_keys[i];
                                if(typeof $scope.consultant.data.social[key] == 'string') {
                                    $scope.consultant_query[key] = $scope.consultant.data.social[key];
                                }
                            }

                            $scope.consultant_query.first_name = $scope.consultant.data.name.first_name;
                            $scope.consultant_query.last_name = $scope.consultant.data.name.last_name;


                        }
                    }

                        $scope.$apply();
                        $('select').formSelect();
                        M.updateTextFields();
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

            if(consultant.data.slug == 'corp') {
                $timeout(() => {
                    $scope.seen_exit_intent = true;
                    M.Modal.getInstance($('#root_setup')).open();
                    $scope.$apply();
                });
            }   
                
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

                if($.inArray(location.host.substring(0,2), ['uk','us']) > -1) {
                    region = location.host.substring(0,2);
                }

                /* Overwrite Region on URL Param */
                if(params.get('region') !== null) {
                    var new_region = params.get('region').toLowerCase();
                    region = $.inArray(new_region, ['uk','us']) > -1 ? new_region : region;

                }

                /* Store Data */
                catalogues.region = region;
                catalogues.set(e, consultant);

                $scope.catalogue_url = location.href;

                $timeout(function() {
                    $scope.catalogue = catalogues;
                    $scope.consultant = consultant;
                    $scope.consultant.data.region = region;

                    var consultant_keys = Object.keys($scope.consultant.data);
                    for (var i = consultant_keys.length - 1; i >= 0; i--) {
                        var key = consultant_keys[i];

                        if(key == 'welcome_message' && !$scope.consultant.data[key]) {
                            $scope.consultant.data[key] = '';
                        }

                        if(typeof $scope.consultant.data[key] !== 'object') {
                            $scope.consultant_query[key] = $scope.consultant.data[key];
                        }

                    }

                    $scope.$apply();
                });

                $scope.open_video_modal = function($item) {
                    $timeout(function() {
                        catalogues.modal = $item;
                        $scope.$apply();
                    });
                };

                $scope.prep_product_url = function($url) {
                    var glue = '?';
                    if($url.indexOf(glue) > -1) {
                        glue = '&';
                    }

                    if(typeof $scope.catalogue == 'object' && $scope.catalogue.party !== null && typeof $scope.catalogue.party.bid !== 'undefined') {

                        $url = $url + glue + 'bid=' + $scope.catalogue.party.bid + '&po=' + $scope.catalogue.party.id; 
                    } else {

                        if(typeof $scope.consultant.url_slug !== 'undefined') {
                            var shop_bid = localStorage.getItem($scope.consultant.url_slug + '_shop_bid');

                            if(shop_bid) {
                                if(glue == '&') {
                                    $url = $url.split('?')[0];
                                    glue = '?';
                                }
                                $url = $url + glue + 'bid=' + shop_bid;
                            }
                        }
                    }

                    return $url;
                }

                $scope.mail_favourites = function() {
                    var link = 'mailto:' + $scope.consultant.data.email;
                    link += '?subject=My%20Favourites%20List&body=';
                    var body = 'Hi ' + $scope.consultant.data.name.first_name + ', I am interested in the following products.';
                    body += "\n\n";
                    var favourite_keys = Object.keys($scope.favourite.$data);
                    for (var i = favourite_keys.length - 1; i >= 0; i--) {
                        var key = favourite_keys[i];
                        var product = $scope.catalogue.pages.data.items[key];
                        body += '- ' + escape(product.item.name).replace(/\%20/g, ' ').replace(/\%A3/g, '').replace(/\<BR\>/g, '%0A').replace(/\%26/g, 'and') + ' (' + (product.price) + ') ' + '[' + product.plu + ']';
                        body += "\n";
                    }

                    body += "\n";
                    body += 'Kind regards,';
                    body += "\n";

                    body = encodeURI(body);

                    location.href = link + body;
                }


                /* Init Flipbook */
                $scope.pdf_url = cdn_url + '/catalogue/' + (catalogues.get()[region + '_pdf_file']);
                $scope.flipbook = $('.solid-container').FlipBook({
                    pdf: $scope.pdf_url,
                    template: {
                        sounds: {
                            startFlip: 'dist/js/3d-flip-book/sounds/flip.mp3'
                        }
                    },
                    propertiesCallback: function(props) {
                        props.cover.color = 0x000000;
                        props.cssLayersLoader = function(n, clb) {
                            console.log(n);
                        }

                        return props;
                    },
                    ready: function(scene) {
                        var height = window.innerHeight;
                        var m_top = 0;
                        if(window.innerWidth < 900) {
                            m_top = $('nav').height();
                            height -= m_top;
                        }

                        $('.solid-container iframe').css({
                            'height': height,
                            'margin-top': m_top
                        });

                        window.scene = (scene);

                        window.onresize = function(event) {
                            $('.solid-container iframe').css({
                                'height': height,
                                'margin-top': m_top
                            });
                        };
                        // scene.ctrl.addEventListener('endFlip', function(e) { 
                        //     console.log(scene.ctrl.getPageForGUI());
                        //   });
                    }
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
                    if(e.clientY <= 15 && (e.clientX < (window.innerWidth/3)) && !$scope.seen_exit_intent) {
                        M.Modal.getInstance(options_modal).open();
                        $scope.seen_exit_intent = true;
                    }
                });

                /* Setup loop for Page Change */
                setTimeout(function() {
                    // $scope.favourite.get_all();

                    $scope.can_install_app = window.can_install_app;

                    if(is_ios_safari) {
                        $scope.can_install_app = window.can_install_app = true;
                    }

                    if(window.can_install_app && !window.matchMedia('(display-mode: standalone)').matches && $scope.catalogue.party == null && $scope.consultant.data.slug !== 'corp') {
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

                    $scope.page_move_handler = null;

                    $scope.this_page_index = ($scope.flipbook.ctrl.state.singlePage ? $scope.flipbook.ctrl.getPage() : $scope.flipbook.book.getPage()) + 1;
                    if($scope.flipbook.book.isProcessing()) {
                        return;
                    }
                    if ($scope.this_page_index !== $scope.page_index) {
                        $scope.page_index = $scope.this_page_index;

                        $timeout(function() {
                            catalogues.active_page = $scope.this_page_index;
                            $scope.$apply();
                        });

                        /* We're on the last page */
                        if($scope.page_index == $scope.flipbook.book.getBookPages()) {
                            M.Modal.getInstance(options_modal).open();
                        }

                        $scope.active_items = [];

                        if (typeof catalogues.pages.data.order[$scope.page_index] !== 'undefined') {

                            $scope.active_items = $.map($scope.catalogue.pages.data.order[$scope.page_index], function(item, index) {
                                return $scope.catalogue.pages.data.items[item];
                            });

                        }

                        $timeout.cancel($scope.page_move_handler);
                        $scope.page_move_handler = $timeout(function() {

                            /* is sequence of 2 */
                            if($scope.this_page_index % 2 == 0 && typeof catalogues.pages.data.order[$scope.this_page_index] !== 'undefined' && !$scope.flipbook.ctrl.state.singlePage) {

                                $scope.active_items = $scope.active_items.concat($.map($scope.catalogue.pages.data.order[parseInt($scope.this_page_index)+1], function(item, index) {
                                  return $scope.catalogue.pages.data.items[item];
                                }));

                                console.log('concat', $scope.active_items);
                            }


                            $scope.$apply();

                            var length = $scope.active_items.length;

                            if(!length) {
                                return;
                            }

                            M.Toast.dismissAll();
                            M.toast({
                                html: ('There ' + (length == 1 ? 'is' : 'are') + ' % item' + (length == 1 ? '' : 's') + ' to view <button class="btn-flat toast-action" onclick="M.Sidenav.getInstance(basket_sidebar).open()">View</button>').replace('%', length),
                                displayLength: 5000,
                            });
                        });

                    }

                }, 600);

            }, (e) => {
                console.warn('error loading catalogue', e);
            });

        }, (e) => {
                console.log(e);
                console.log('attempting to launch configurator');
                $scope.hide_party_links = true;
                M.Toast.dismissAll();
                if(location.host.substring(0,9) == 'configure') {
                    $scope.launch_configurator(true);
                } else {
                    M.Modal.getInstance($('#consultant_not_setup')).open();
                }
        });

        

    }]);


    appController.factory('consultant', function() {

        var ct_slug = is_local ? '/shropshireorganic' : location.pathname.toLowerCase();
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

        var region = params.get('region') ? params.get('region') : ($.inArray(location.host.substring(0,2), ['uk','us']) > -1 ? location.host.substring(0,2) : 'uk');

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

    appController.factory('catalogues', function() {

        var http = new Promise((resolve, reject) => {
            $.ajax({
                url: cdn_url + '/catalogue/catalogue.json?cache_buster=true',
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
            staging: false,
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
                        }
                        if(typeof consultant.data == 'object' && typeof consultant.data.party_links == 'object') {
                            if(typeof consultant.data.party_links[party_code] !== 'undefined') {
                                var party = consultant.data.party_links[party_code];
                                party.id = party_code;

                                delete party.bid;

                                if(typeof get_party_bid == 'undefined') {

                                    function get_party_bid(party) {
                                        console.log($this);
                                        var party_session = localStorage.getItem(party.id);
                                        if(party_session == null) {
                                            $.ajax({
                                                url: api_url + 'get_party_bid',
                                                type: 'POST',
                                                data: {
                                                    slug: consultant.data.slug,
                                                    code: party.id
                                                },
                                            })
                                            .done(function(e) {
                                                console.log(e);
                                                if(e.success) {

                                                    if(party.name) {
                                                        M.toast({
                                                            html: ('You have joined ' + party.name + '\'s Party'),
                                                            displayLength: 6000
                                                        });
                                                    }

                                                    party.bid = e.data.bid;
                                                    $this.party.bid = e.data.bid;
                                                    localStorage.setItem($this.party.id, e.data.bid);
                                                    localStorage.setItem(party.id + '_timeout', ((new Date().getTime()) + 600000));
                                                } else {
                                                    if(party.name) {
                                                        M.toast({
                                                            html: (party.name + '\'s Party has now expired'),
                                                            displayLength: 6000
                                                        });
                                                    }
                                                }
                                            })
                                            .fail(function() {
                                                M.toast({
                                                    html: ('An error occured joining Party'),
                                                    displayLength: 2000
                                                });
                                            });
                                            
                                        } else {
                                            party.bid = party_session;



                                            var party_link_timeout = localStorage.getItem(party.id + '_timeout');
                                            if(party_link_timeout == null) {
                                                var now_time_p10 = (new Date().getTime()) + 600000;
                                                localStorage.setItem(party.id + '_timeout', now_time);
                                                party_link_timeout = now_time;
                                            }

                                            var now = new Date().getTime();
                                            if(now >= party_link_timeout) {
                                                localStorage.removeItem(party.id);
                                                localStorage.removeItem(party.id + '_timeout');
                                                get_party_bid(party);

                                            } else {
                                                M.toast({
                                                    html: ('You have joined ' + party.name + '\'s Party'),
                                                    displayLength: 6000
                                                });
                                            }


                                        }
                                    }
                                }

                                get_party_bid(party);

                            }
                        }
                    } else {
                        /* Get Shop BID if no party */
                        if(typeof consultant.data == 'object') {
                            var shop_bid = localStorage.getItem(consultant.data.slug + '_shop_bid');
                            if(shop_bid) {
                                $this.shop_bid = shop_bid;
                            } else {
                                $.ajax({
                                    url: api_url + 'get_shop_bid',
                                    type: 'POST',
                                    data: {
                                        slug: consultant.data.slug,
                                    },
                                })
                                .done(function(e) {
                                    if(e.success && e.data.bid !== null) {
                                        localStorage.setItem(consultant.data.slug + '_shop_bid', e.data.bid);
                                        $this.shop_bid = e.data.bid;
                                    }
                                })
                                .fail(function(e) {
                                    console.warn('An error occured getting shop BID');
                                });
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

                if(location.host.substring(0,7) == 'staging' && !this.staging) {
                    this.staging = true;
                    M.toast({
                        html: ('Staging Environment'),
                        displayLength: 2000
                    });
                }

                for (var i = $this.data.length - 1; i >= 0; i--) {
                    var item = $this.data[i];

                    if(this.staging && item.environment == 'staging' || !this.staging && item.environment == 'production') {
                        index = i;
                    }
                }

                var cat = $this.data[index ? index : 0];

                if(typeof cat == 'object' && typeof cat.primary_color !== 'undefined') {
                    if(cat.primary_color) {
                        $('nav.main-nav').css('background-color', cat.primary_color);
                    }

                    if(cat.secondary_color) {
                        $('body').css('background-color', cat.secondary_color);
                    }
                }

                return cat;
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
        $('.sidenav').sidenav({
            onOpenStart: function() {
                $('.sidenav')[0].scrollTop = 0;
            }
        });
        $('.tooltipped').tooltip();
        $('.modal:not(.non-dismiss)').modal({
            dismissible: true
        });
        $('.modal.non-dismiss').modal({
            dismissible: false
        });
        $('.chips').chips();
        $('select').formSelect();
        $('.tabs').tabs();
        $('.dropdown-trigger').dropdown();
    });

})(jQuery);