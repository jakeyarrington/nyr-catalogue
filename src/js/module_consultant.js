(function() {

	Module.add(function($scope) {

		var $timeout = $scope.$timeout;
		var consultant = $scope._consultant;

		$scope.get_consultant_region = function($add_dot) {

            var prefix_region = location.host.substring(0,2).toLowerCase();

            if(is_local) {
                prefix_region = 'uk';
            }

            if(prefix_region == 'uk' || prefix_region == 'us') {
                return prefix_region + ($add_dot ? '.' : '');
            }

            if(typeof params.get == 'function') {
                if(params.get('region') !== null) {
                    var region = (params.get('region').toLowerCase());
                }
            }

            if(typeof region == 'undefined') {
                var region = ($scope.consultant !== undefined ? $scope.consultant.data.region : $scope.consultant_query.region);
            }

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

        };
	}, 10);

})();