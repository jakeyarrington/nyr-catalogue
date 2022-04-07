
	/*
	 * @name open_video_modal
	 */
	$scope.open_video_modal = function($item) {
        $timeout(function() {
            catalogues.modal = $item;
            $scope.$apply();
        });
    };

    $scope.range = function(min, max, step) {
        step = step || 1;
        var input = [];
        for (var i = min; i <= max; i += step) {
            input.push(i);
        }
        return input;
    };

    $scope.init_select = function() {
        $('select').formSelect();
    };

    $scope.open_sidebar = function($el) {
    	M.Sidenav.getInstance($($el)[0]).open();
    };

    $scope.get_product_by_plu = function($plu) {

    	var products = $scope.catalogue.pages.data.items;
    	var keys = Object.keys(products);

    	if(typeof $plu == 'number' || $plu.substring(0,3) !== 'PLU') {
    		$plu = 'PLU ' + $plu;
    	}

    	for (var i = keys.length - 1; i >= 0; i--) {
    		var key = keys[i];
    		if(products[key].plu == $plu) {
    			return products[key];
    		}
    	}

    	return false;

    };

	/*
	 * @name close_modal
	 * @info Used to close Materialize modals from
	 		 within the Angular app.
	 */

	$scope.close_modal = function($id) {
        M.Modal.getInstance($($id)).close();
    };

	/*
	 * @name htmlencode
	 * @info Encodes HTML strings, used for product names etc
	 		 coming through the API.
	 */
	$scope.htmlencode = function($str) {
        return $str.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
          return '&#' + i.charCodeAt(0) + ';';
        });
    };

    /*
     * @name sort_items
     * @info Used to sort products in the sidebar.
     */
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
    };