
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
                html: ('You have ' + ($value == 1 ? 'favourited' : 'unfavourited') + ' ' + catalogues.pages.data.items[$key].item.name + ' <button class="btn-flat toast-action" onclick="M.Sidenav.getInstance(document.getElementById(\'favourites_sidebar\')).open()">View</button>').replace('%', length),
                displayLength: 5000,
            });
            return this.update($key, $value);
        },
        remove: function($key) {
            this.update($key, -1);
        }

    };