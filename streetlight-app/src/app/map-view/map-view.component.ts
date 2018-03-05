import { Component, OnInit } from '@angular/core';
import { AgmCoreModule } from '@agm/core';
import { MapService } from '../map.service';
import { Marker } from '../marker';
import { Promise } from 'q';
import { LogService } from '../shared/log.service';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';
import Map from 'ol/map';
import Tile from 'ol/layer/tile';
import XYZ from 'ol/source/xyz';
import View from 'ol/view';
import proj from 'ol/proj';
import Feature from 'ol/feature';
import Point from 'ol/geom/point';
import VectorLayer from 'ol/layer/vector';
import VectorSource from 'ol/source/vector';
import Icon from 'ol/style/icon';
import Style from 'ol/style/style';
import Circle from 'ol/style/circle'
import Fill from 'ol/style/fill';





@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements OnInit {

  title: string = 'Streetlights';
  lat: number = 39.090265;
  lng: number = -94.576062;
  zoom: number = 6;
  minZoom: number = 8;
  mapDraggable: boolean = false;
  streetlightMarkers: Marker[];
  filteredStreetlightMarkers: Marker[];
  nema: boolean = false;
  wireless: boolean = false;
  fixtureMfg: string;
  filters = {};
  constructor(private logger: LogService, private mapService: MapService, private http: HttpClient) {
    this.streetlightMarkers = [];
    this.filteredStreetlightMarkers = [];
    this.http = http;
  }

  ngOnInit() {
    var self = this;
    this.http.get('https://my.api.mockaroo.com/streetlights.json?key=08931ac0').subscribe(function(data){
      self.renderMap(data);
    });
    //this.getStreetlights();
    //this.applyFilters(this.renderMap);

  }

  getStreetlights() {
      this.mapService.getStreetlights().subscribe(function(data){
        console.log(data);
      });
  }

  renderMap(streetlightMarkers) {
    var features = [];
    var vectorSource = new VectorSource();
    var vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
              image: new Circle({
                radius: 8,
                fill: new Fill({
                  color: 'yellow'
                })
              })

            })
    });
      let map = new Map({
          target: 'map',
          layers: [
            new Tile({
              source: new XYZ({
                url: 'http://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
              })
            }),
            vectorLayer
          ],
          view: new View({
            center: proj.fromLonLat([-94.576062, 39.090265]),
            zoom: 12
          })
        });
        console.log(streetlightMarkers);
        if(streetlightMarkers){
          streetlightMarkers.map(function(item){
            vectorSource.addFeature(
              new Feature({
                geometry: new Point(proj.fromLonLat([item.lon, item.lat]))
              }));
          })
        }

  }

  private applyFilters(callback) {
    console.log(this.filters);
    this.filteredStreetlightMarkers = _.filter(this.streetlightMarkers, _.conforms(this.filters) );
    callback(this.filteredStreetlightMarkers);
  }

  /// filter property by equality to rule
  filterExact(property: string, rule: any) {
    if (rule === '' || !rule) {
      this.removeFilter(property);
      this.applyFilters(this.renderMap);
    } else {
      this.filters[property] = val => val == rule
      this.applyFilters(this.renderMap);
    }

  }

  /// filter  numbers greater than rule
  filterGreaterThan(property: string, rule: number) {
    this.filters[property] = val => val > rule;
    this.applyFilters(this.renderMap);
  }

  /// filter properties that resolve to true
  filterBoolean(property: string, rule: boolean) {
    if (!rule) this.removeFilter(property)
    else {
      this.filters[property] = val => val;
      this.applyFilters(this.renderMap);
    }
  }

  /// removes filter
  removeFilter(property: string) {
    delete this.filters[property]
    this[property] = null;
    this.applyFilters(this.renderMap);
  }


}
