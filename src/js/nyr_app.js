(function($) {

    var pages = [];
    var page_index = 0;
    var app = angular.module('nyr', ['ngSanitize']);
    var seen_exit_intent = false;
    window.can_install_app = false;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
        window.can_install_app = true;
        console.log(e, can_install_app);
    });


    appController = app.controller('app', ['$scope', 'catalogues', 'consultant', '$timeout', function($scope, catalogues, consultant, $timeout) {

        $scope.page_index = 0;
        window.scope = $scope;
        window.catalogues = catalogues;
        window.consultant = consultant;

        $scope._consultant = consultant;
        $scope.$timeout = $timeout;

        /*
         * @name Module Loader
         * @info To free up space in the controller we have 
         *       created a custom module loader to embed custom
                 code pertaining the scope which is assigned when
                 the controller is executed.
         */
        $.each(Module.modules, function(index, list) {
            if(typeof list !== 'undefined') {
                for (var i = list.length - 1; i >= 0; i--) {
                    if(typeof list[i] == 'function') {
                        list[i]($scope);
                    }
                }
            }
        });

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
            pinterest: '',
            welcome_message: default_welcome_message,
            whatsapp: '',
            newsletter: ''
        };

        $scope.hide_party_links = false;

        $scope.consultant_party_codes = [
            {code: ''}
        ];

        $scope.saving_party_codes = false;
        $scope.loaded_materialize = false;

        $scope.$on('$includeContentLoaded', function(event, target){

            if(!$scope.loaded_materialize) {

                basket_sidebar = document.getElementById('basket_sidebar');
                favourites_sidebar = document.getElementById('favourites_sidebar');
                options_modal = document.getElementById('options');

                $('.sidenav').sidenav({
                    closeOnClick: false,
                    onOpenStart: function() {
                        $('.sidenav')[0].scrollTop = 0;
                    }
                });
                

                $scope.loaded_materialize = true;
            }

            $('.modal:not(.non-dismiss)').modal({
                dismissible: true
            });
            $('.modal.non-dismiss').modal({
                dismissible: false
            });

            $('.tooltipped').tooltip();
            $('.chips').chips();
            $('select').formSelect();
            $('.tabs').tabs();
            $('.dropdown-trigger').dropdown();

        });

        

        $scope.view_product = function($item) {
            $timeout(() => {
                $scope.active_product = $item;
                $scope.$apply();
                M.Modal.getInstance($('#moreinfo')).open();
            });
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
                    $scope.api_basket.init();
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
                        console.log(options_modal);
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

    app.filter('safeHtml', function($sce) {
        return function(val) {
            return $sce.trustAsHtml(val);
        };
    });

})(jQuery);