Ext.define('ArrivalKillCalculator', {

    config: {
        bucketBy: '',
        colourField: 'Severity'
    },

    constructor: function(config) {
        this.initConfig(config);
    },

    prepareChartData: function(store) {
        var colourBy = this.config.colourField || 'Severity';
        console.log('Colouring By: ', colourBy);
        var allSeries = [];
        allSeries["Arrival"] = [];
        allSeries["Kill"] = [];

        var calcSeries = [];

        var arrivalData = this._groupData(store.getRange(), 'CreationDate');
        var closedDefects = _.filter(store.getRange(), function(record) { return !!record.get('ClosedDate'); }),
        killData = this._groupData(closedDefects, 'ClosedDate'),
        categories = _.keys(arrivalData);
        var colouring = _.keys(this._chunkData(store.getRange(),colourBy));

        console.log('Colouring Options: ', colouring);
        var netSeries = { name: 'Net', type: 'line', data: [] };

        _.each(colouring, function(colour){
            allSeries["Arrival"][colour] = {data:[]};
            allSeries["Kill"][colour] = {data:[]};
            _.each(categories, function(category) {
                allSeries["Arrival"][colour].data.push(_.filter(arrivalData[category], function(record) {
                    return record.get(colourBy) === colour;
                }).length);
                allSeries["Kill"][colour].data.push(_.filter(killData[category], function(record) {
                    return record.get(colourBy) === colour;
                }).length);
            });
        });

        var net = 0;
        _.each(categories, function(category) {
                net += (arrivalData[category] || []).length - (killData[category] || []).length;
                netSeries.data.push(net); 
        });

        _.each(_.keys(allSeries), function(stack) {
            _.each(_.keys(allSeries[stack]), function(colour) {
                var newSeries = {
                    name: (colour || "unset") + ' (' + stack + ') ',
                    stack: stack,
                    data: allSeries[stack][colour].data
                };
                calcSeries.push(newSeries);
            });
        });

        calcSeries.push(netSeries);
        return {
            categories: categories,
            series: calcSeries
        };
    },

    _groupData: function(records, field) {
        return _.groupBy(records, function(record) {
            if (this.bucketBy === 'week') {
                return moment(record.get(field)).startOf('week').format('MMM D');
            } else if (this.bucketBy === 'month') {
                return moment(record.get(field)).startOf('month').format('MMM \'YY');
            }
        }, this);
    },

    _chunkData: function(records, field) {
        return _.groupBy(records, function(record) {
                return record.get(field);
        }, this);
    }
});
