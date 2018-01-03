Ext.define('DefectArrivalKillChartApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    layout: 'fit',
    autoScroll: false,

    requires: [
        'ArrivalKillCalculator'
    ],

    config: {
        defaultSettings: {
            bucketBy: 'week',
            colourField: 'Severity',
            query: ''
        }
    },

    launch: function() {
        Rally.data.wsapi.ModelFactory.getModel({
            type: 'defect'
        }).then({
            success: function(model) {
                this.model = model;
                this._addChart();
            },
            scope: this
        });
    },

    getSettingsFields: function() {
        return [
            {
                name: 'bucketBy',
                xtype: 'rallycombobox',
                plugins: ['rallyfieldvalidationui'],
                fieldLabel: 'Bucket By',
                displayField: 'name',
                valueField: 'value',
                editable: false,
                allowBlank: false,
                store: {
                    fields: ['name', 'value'],
                    data: [
                        { name: 'Week', value: 'week' },
                        { name: 'Month', value: 'month' },
                        //{ name: 'Quarter', value: 'quarter' },
                        //{ name: 'Iteration', value: 'iteration' }
                    ]
                },
                lastQuery: ''
            },
            {
                name: 'colourField',
                fieldLabel: 'Colour On',
                xtype: 'rallyfieldcombobox',
                model: 'Defect',
                listeners: {
                    ready: function(combo) {
                        combo.store.filter({filterFn: function(record) {
                            var attr = record.get('fieldDefinition').attributeDefinition;
                            return attr && !attr.ReadOnly && attr.Constrained && attr.AttributeType !== 'OBJECT' && attr.AttributeType !== 'COLLECTION';
                        }});
                    }
                }
            },
            {
                type: 'query'
            }
        ];
    },

    _addChart: function() {
        var context = this.getContext(),
            whiteListFields = ['Milestones', 'Tags'],
            modelNames = [this.model.typePath],
            gridBoardConfig = {
                xtype: 'rallygridboard',
                toggleState: 'chart',
                chartConfig: this._getChartConfig(),
                plugins: [{
                    ptype:'rallygridboardinlinefiltercontrol',
                    showInChartMode: true,
                    inlineFilterButtonConfig: {
                        stateful: true,
                        stateId: context.getScopedStateId('filters'),
                        filterChildren: false,
                        modelNames: modelNames,
                        inlineFilterPanelConfig: {
                            quickFilterPanelConfig: {
                                defaultFields: ['Owner', 'Priority'],
                                addQuickFilterConfig: {
                                   whiteListFields: whiteListFields
                                }
                            },
                            advancedFilterPanelConfig: {
                               advancedFilterRowsConfig: {
                                   propertyFieldConfig: {
                                       whiteListFields: whiteListFields
                                   }
                               }
                           }
                        }
                    }
                }],
                context: context,
                modelNames: modelNames,
                storeConfig: {
                    filters: this._getFilters()
                }
            };

        this.add(gridBoardConfig);
    },

    _getChartConfig: function() {
        return {
            xtype: 'rallychart',
            chartColors: [  
                "#8dd3c7", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", 
                "#d9d9d9", "#bc80bd", "#ccebc5", "#1baf8e", "#7db5b8", "#f700e4", 
                "#0163a7", "#fb68c4", "#6fbcd2", "#b3b3b3", "#79017a", "#aad78a",
                "#722c3a", "#00004e", "#414527", "#047f8f", "#7f4e2e", "#024b9f", "#4c2198", "#03321c", 
                "#262628", "#437f44", "#33143c", "#001292", "#22c3a7", "#20009c", "#828a4e", "#08ef1e", 
                "#04975e", "#984550", "#0ee458", "#4c4c50", "#8fd888", "#002584"
            ],
            storeType: 'Rally.data.wsapi.Store',
            storeConfig: {
                context: this.getContext().getDataContext(),
                limit: Infinity,
                fetch: this._getChartFetch(),
                sorters: this._getChartSort(),
                pageSize: 2000,
                model: this.model
            },
            calculatorType: 'ArrivalKillCalculator',
            calculatorConfig: {
                bucketBy: this.getSetting('bucketBy'),
                colourField: this.getSetting('colourField')
            },
            chartConfig: {
                chart: { type: 'column' },
                title: {
                    text: ''
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Count'
                    }
                },
                plotOptions: {
                    column: {
                        stacking: 'normal',
                        dataLabels: {
                            enabled: false
                        }
                    }
                }
            }
        };
    },

    onSettingsUpdate: function() {
        this.callParent(arguments);

        var gridBoard = this.down('rallygridboard');
        if (gridBoard) {
            gridBoard.destroy();
        }
        this._addChart();

    },

    onTimeboxScopeChange: function() {
        this.callParent(arguments);

        var gridBoard = this.down('rallygridboard');
        if (gridBoard) {
            gridBoard.destroy();
        }
        this._addChart();
    },

    _getChartFetch: function() {
        return ['Name', this.getSetting('colourField'), 'ClosedDate', 'CreationDate'];
    },

    _getChartSort: function() {
        return [{ property: 'CreationDate', direction: 'ASC' }];
    },

    _getFilters: function() {
        var queries = [],
            timeboxScope = this.getContext().getTimeboxScope();
        if (timeboxScope) {
            queries.push(timeboxScope.getQueryFilter());
        }
        if (this.getSetting('query')) {
            queries.push(Rally.data.QueryFilter.fromQueryString(this.getSetting('query')));
        }
        return queries;
    }
});
