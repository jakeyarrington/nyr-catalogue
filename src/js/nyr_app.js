(function($) {

    var pages = [];
    var page_index = 0;
    var app = angular.module('nyr', ['ngSanitize']);

    const is_local = location.href.indexOf('localhost') > -1;
    const cdn_url = is_local ? 'http://localhost:8080/mockdata/' : 'https://yarrington-objects.fra1.cdn.digitaloceanspaces.com/nyr/catalogue/';
    const base_url = location.protocol + '//' + location.host;

    const basket_sidebar = document.getElementById('basket_sidebar');
    const favourites_sidebar = document.getElementById('favourites_sidebar');
    const options_modal = document.getElementById('options');

    var appController = app.controller('app', ['$scope', 'catalogues', 'consultant', '$timeout', function($scope, catalogues, consultant, $timeout) {

        $scope.page_index = 0;
        window.scope = $scope;
        window.catalogues = catalogues;
        window.consultant = consultant;

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

        consultant.http.then((e) => {

            /* Store Data */
            consultant.set(e);  

            $scope.consultant = consultant.get();

            if(location.search.indexOf('forward') > -1) {
                return header.location = 'https://' + $scope.consultant.region + '.nyrorganic.com/shop/' + $scope.consultant.slug;
            }
            

            catalogues.http.then((e) => {

                var region = typeof $scope.consultant.region !== 'undefined' ? $scope.consultant.region : 'uk';

                /* Store Data */
                catalogues.region = region;
                catalogues.set(e, consultant);

                

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
                    if(e.clientY <= 15) {
                        M.Modal.getInstance(options_modal).open();
                    }
                });

                /* Setup loop for Page Change */
                setInterval(function() {
                    // $scope.favourite.get_all();
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

            });

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
        if(ct_slug.indexOf('/configure') > -1) {
            ct_config = true;
            ct_slug = ct_slug.replace('/configure', '');
        }

        // Check for any segments
        if(ct_slug.indexOf('/') > -1) {
            ct_slug = ct_slug.split('/')[0];
        }


        $('head').append('<link rel="manifest" href="https://nyr-catalogue-wp.yarrington.app/wp-json/app/v1/consultant_manifest?id='+ct_slug+'"/>');


        var http = new Promise((resolve, reject) => {
            $.ajax({
                url: 'https://nyr-catalogue-wp.yarrington.app/wp-json/app/v1/consultant?id=' + ct_slug,
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
            loaded: false,
            active_page: 0,
            modal: [],
            region: 'uk',
            pages: {
                data: [],
                map: function() {
                    var $this = response;
                    var catalogue = $this.get();
                    console.log($this.region);
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
                    console.log('branded data');
                    console.log(consultant.data);
                }

                this.data = JSON.parse(data);
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
    });

})(jQuery);