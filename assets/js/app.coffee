########## Models and Collections ################

Location = Backbone.Model.extend
    initialize: ->
        if @attributes? and @attributes.OBJECTID?
            @id = @attributes.OBJECTID

    url: ->
        return "/locations/" + @id

LocationCollection = Backbone.Collection.extend
    model: Location
    url: "/locations/"

Locations = new LocationCollection

########### Views ################

LocationItemView = Backbone.View.extend
    el: $('#locationView')

    initialize: ->
        @map = new google.maps.Map document.getElementById('map'), {
            center: new google.maps.LatLng(21.2711981, -157.8005013)
            zoom: 17
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }

    setModel: (model) ->
        @model = model

    renderMap: ->
        @map.setCenter new google.maps.LatLng(@model.attributes.geometry[1], @model.attributes.geometry[0])
        marker = new google.maps.Marker {
              position: new google.maps.LatLng @model.attributes.geometry[1], @model.attributes.geometry[0]
              map: @map
        }


    render: ->
        @$('h1').html @model.attributes.NAME
        @$('#details').html "<p>Open #{@model.attributes.DAYS} from #{@model.attributes.HOURS}</p>"
        if @model.attributes.DESCRIPTIO? and @model.attributes.DESCRIPTIO != ' '
            @$('#details').html @$('#details').html() + "<p>Notes: #{@model.attributes.DESCRIPTIO}</p>"
        console.log @model.attributes
        @renderMap()
        return this

LocationRowView = Backbone.View.extend
    tagName: 'li'
    template: _.template $('#locationTemplate').html()

    render: ->
        @$el.html @template(@model.toJSON())
        return this

ResultView = Backbone.View.extend
    el: $('#resultView')
    initialize: ->
        # Clear the list of results
        @$el.empty()

        Locations.fetch {
            data: {
                lat: @options.lat
                long: @options.long
            }

            success: (collection, response) =>
                @collection = collection
                @render()
        }

        @render()

    render: ->
        if @collection?
            @$el.empty()

            @collection.each (location) =>
                # console.log location
                view = new LocationRowView {model: location}
                @$el.append view.render().el
        else
            @$el.append '<li>Loading</li>'

        # Rerender the list view to get the jQuery Mobile stylings.
        @$el.listview 'refresh'

SearchView = Backbone.View.extend
    el: $('#searchView')
    initialize: ->
        @initializeSearchBox @$('input[type=text]')

    initializeSearchBox: (searchBox) ->
        # Default bounds for Honolulu
        defaultBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(21.3111981, -157.8405013),
            new google.maps.LatLng(21.2711981, -157.8005013)
        )
        options =
            bounds: defaultBounds
            types: ['geocode']
            componentRestrictions: {country: 'us'}

        autocomplete = new google.maps.places.Autocomplete searchBox.get(0), options

        # Set up a place changed listener for the box.
        google.maps.event.addListener autocomplete, 'place_changed', =>
            place = autocomplete.getPlace()
            @getResults place.geometry.location.Xa, place.geometry.location.Ya

    events:
        'click .ui-btn-right': 'requestLocation'

    requestLocation: (event) ->
        navigator.geolocation.getCurrentPosition (position) =>
            @$('input[type=text]').val "Current Location"
            @getResults position.coords.latitude, position.coords.longitude

    getResults: (latitude, longitude) ->
        resultView = new ResultView {lat: latitude, long: longitude}

########## Router ##############
AppRouter = Backbone.Router.extend
    routes:
        "": "search"
        "locations/:id": "showLocation"

    initialize: ->
        # Handle click in back button.
        $("a[data-rel=back]").live 'click', (event) ->
            window.history.back()
            false

        @firstPage = true
        @searchView = new SearchView()
        @locationView = new LocationItemView()

    changePage: (page) ->
        transition = $.mobile.defaultPageTransition
        if @firstPage
            transition = 'none'
            @firstPage = false

        $rendered = $(page.render().el)
        $.mobile.changePage $rendered, {changeHash: false, transition: transition}
        # Needed to rerender page. Page doesn't rerender the second time it is clicked.
        $rendered.trigger('pagecreate')

    search: ->
        @changePage(@searchView)

    showLocation: (id) ->
        location = new Location {id: id}
        location.fetch {
            success: (model, response) =>
                @locationView.setModel model
                @changePage(@locationView)
        }

######### Entry point #########
$(document).ready ->
    router = new AppRouter()
    Backbone.history.start()
