(function($) {

    var pages = [];
    var page_index = 0;
    var app = angular.module('nyr', ['ngSanitize']);

    const cdn_url = location.href.indexOf('localhost') > -1 ? 'http://localhost:8080/mockdata/' : 'https://yarrington-objects.fra1.cdn.digitaloceanspaces.com/nyr/catalogue/';

    const basket_sidebar = document.getElementById('basket_sidebar');

    var appController = app.controller('app', ['$scope', 'catalogues', 'consultant', '$timeout', function($scope, catalogues, consultant, $timeout) {

        $scope.page_index = 0;
        window.scope = $scope;
        window.catalogues = catalogues;
        window.consultant = consultant;

        consultant.http.then((e) => {

            /* Store Data */
            consultant.set(e);  

            $scope.consultant = consultant.get();

            catalogues.http.then((e) => {

                var region = typeof $scope.consultant.region !== 'undefined' ? $scope.consultant.region : 'uk';

                /* Store Data */
                catalogues.set(e, consultant);

                catalogues.region = region;

                $timeout(function() {
                    $scope.catalogue = catalogues;
                    $scope.$apply();
                });

                $scope.open_video_modal = function($item) {
                    $timeout(function() {
                        catalogues.modal = $item;
                        console.log($item);
                        $scope.$apply();
                    });
                };

                /* Init Flipbook */
                $scope.flipbook = $('.solid-container').FlipBook({
                    pdf: cdn_url + (catalogues.get()[region + '_pdf_file'])
                });

                /* Setup loop for Page Change */
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

                        if (typeof catalogues.pages.data[$scope.page_index] !== 'undefined') {

                            $scope.active_items = catalogues.pages.data[$scope.page_index];
                            var length = catalogues.pages.data[$scope.page_index].length;

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

        var ct_slug = location.pathname;
        var ct_config = false;
        
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
                    var items = catalogue[$this.region + '_items'];
                    $this.pages.data = items;
                }
            },
            set: function(data, consultant) {
                var $this = response;

                if (this.loaded) {
                    return this;
                }

                this.data = typeof data == 'string' ? JSON.parse((consultant ? data.replace('/corp/', '/' + consultant.data.slug + '/') : data)) : data;
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
    });

})(jQuery);