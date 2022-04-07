
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
    };


    $scope.add_party_code = function() {
        $scope.consultant_party_codes.push({
            code: ''
        });
        $timeout(function() {
            M.updateTextFields();
        }, 500);
    };