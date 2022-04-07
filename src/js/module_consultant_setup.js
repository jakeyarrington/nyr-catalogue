
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