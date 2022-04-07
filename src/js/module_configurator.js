
    /*
     * @name launch_configurator
     * @info Method used to launch the configurator modal window.
     */
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

                    } else {

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
    };