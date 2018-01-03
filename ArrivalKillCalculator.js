Ext.define('ArrivalKillCalculator', {

    config: {
        bucketBy: ''
    },

    constructor: function(config) {
        this.initConfig(config);
    },

    prepareChartData: function(store) {
        var allSeries = [];
        allSeries["Arrival"] = [];
        allSeries["Kill"] = [];

        var calcSeries = [];

        var arrivalData = this._groupData(store.getRange(), 'CreationDate');
        var closedDefects = _.filter(store.getRange(), function(record) { return !!record.get('ClosedDate'); }),
        killData = this._groupData(closedDefects, 'ClosedDate'),
        categories = _.keys(arrivalData);
        var severities = _.keys(this._chunkData(store.getRange(),'Severity'));

        var netSeries = { name: 'Net', type: 'line', data: [] };

        _.each(severities, function(severity){
            allSeries["Arrival"][severity] = {data:[]};
            allSeries["Kill"][severity] = {data:[]};
            _.each(categories, function(category) {
                allSeries["Arrival"][severity].data.push(_.filter(arrivalData[category], function(record) {
                    return record.get('Severity') === severity;
                }).length);
                allSeries["Kill"][severity].data.push(_.filter(killData[category], function(record) {
                    return record.get('Severity') === severity;
                }).length);
            });
        });

        var net = 0;
        _.each(categories, function(category) {
                net += (arrivalData[category] || []).length - (killData[category] || []).length;
                netSeries.data.push(net); 
        });

        _.each(_.keys(allSeries), function(stack) {
            _.each(_.keys(allSeries[stack]), function(severity) {
                var newSeries = {
                    name: severity + ' (' + stack + ') ',
                    stack: stack,
                    data: allSeries[stack][severity].data
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
