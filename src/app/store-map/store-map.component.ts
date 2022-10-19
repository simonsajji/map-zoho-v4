import { LocationStrategy } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnChanges, OnInit, ViewChild,AfterViewInit,ChangeDetectorRef } from '@angular/core';
// import { MapInfoWindow } from '@angular/google-maps';
import MarkerClusterer from '@googlemaps/markerclustererplus';
import { isThisSecond } from 'date-fns';
import { environment } from 'src/environments/environment';
import { animate, animation, style, transition, trigger, useAnimation, state, keyframes } from '@angular/animations';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {SelectionModel} from '@angular/cdk/collections';
import { ToastrServices } from 'src/app/services/toastr.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmBoxComponent } from '../confirm-box/confirm-box.component';
import * as moment from 'moment';
import {FormControl} from '@angular/forms';
import {TooltipPosition} from '@angular/material/tooltip';



// export interface LocationElement {
//   name: string;
//   position: number;
//   weight: number;
//   symbol: string;
// }
interface TableObj {
  value: string;
  viewValue: string;
}
interface TableMode {
  value: string;
  viewValue: string;
}
// const ELEMENT_DATA: LocationElement[] = environment.locations;

@Component({
  selector: 'store-map',
  templateUrl: './store-map.component.html',
  styleUrls: ['./store-map.component.css'],
  animations: [
    trigger('navigation', [
      state('false', style({ right: '0%' })),
      state('true', style({ right: '-20%' })),
      transition('0 => 1', animate('.24s')),
      transition('1 => 0', animate('.24s'))
    ]),
    trigger('tableview', [
      state('false', style({ bottom: '-45%' })),
      state('true', style({ bottom: '-99%' })),
      transition('0 => 1', animate('.24s')),
      transition('1 => 0', animate('.24s'))
    ])
  ]
})
export class StoreMapComponent implements OnInit,AfterViewInit{

  @ViewChild('map', { static: false }) info: ElementRef | undefined;
  labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  positionOptions: TooltipPosition[] = ['after', 'before', 'above', 'below', 'left', 'right'];
  position = new FormControl(this.positionOptions[4]);
  mkrs: any = [];
  shortestRte: google.maps.DirectionsRoute | any;
  map: any;
  directionsService = new google.maps.DirectionsService();
  directionsRenderer: any;
  stepDisplay = new google.maps.InfoWindow();
  showSliderMenu: boolean = false;
  showRoutes: boolean = false;
  result: any;
  rightanimationActive: boolean = false;
  leftanimationActive: boolean = false;
  totalDistance: any;
  totalDuration: any;
  infoWin: any = new google.maps.InfoWindow();
  wayPoints: any = [];
  shortestResult: google.maps.DirectionsResult | any;
  pinSideMenu: boolean = false;
  displayDate: any;
  currentDate: any;
  displayTime: any;
  currentTime: any;
  @ViewChild('timepicker') timepicker: any;
  isOpen: any;
  formattedaddress = "";
  options: any = {
    componentRestrictions: {
      country: ["CA"]
    }
  };
  origin: any ;
  destination: any ;
  originMkr: any;
  destMkr: any;
  startstopmkr: any;
  isHomesetasCurrent: boolean = false;
  isHomesetasDefault: boolean = true;
  isHomesetasFavourite: boolean = false;
  isHomesetasEditedLocation: boolean = false;
  isEndsetasCurrent: boolean = false;
  isEndsetasDefault: boolean = true;
  isEndsetasFavourite: boolean = false;
  isEndsetasEditedLocation: boolean = false;
  navigation: boolean = true;
  tableview: boolean = true;
  showOverlay: boolean = false;
  locs:any = environment?.locations;
  displayedColumns: string[] = [];
  dataBaseColumns:any;
  dataSource :any;
  selection = new SelectionModel<any>(true,[]);
  pgIndex:any = 0;  
  tableObjects: TableObj[] = [
    {value: 'route', viewValue: 'Route'},
    {value: 'location', viewValue: 'Location'},
  ];
  tableModes: TableMode[] = [
    {value: 'all', viewValue: 'All'},
    {value: 'route', viewValue: 'Route'},
  ];
  selectedTableObject = this.tableObjects[1].value;
  selectedTableMode = this.tableModes[0].value;
  selectedLocations:any = [];
  initiatedRoute:boolean = false;
  masterCheckbox:boolean = false;
  pageSizeperPage:any;
  isFilterActive:boolean = false;
  @ViewChild(MatPaginator) paginator: MatPaginator | any;
  @ViewChild("sarea") sarea: any;
  @ViewChild("mastercheck") mastercheck: any;
  @ViewChild('filterName') filterName :any;
  @ViewChild('filterRouteName') filterRouteName :any;
  @ViewChild('filterAddress') filterAddress :any;
  

  constructor(private cdr:ChangeDetectorRef,private toastr:ToastrServices,private dialog:MatDialog){ }
  

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    // this.cdr.detectChanges();
  }

  ngOnInit() {   
    this.dataSource = new MatTableDataSource<any>(this.locs);
    console.log(Object.keys(this.locs[0]));
    this.dataBaseColumns = Object.keys(this.locs[0]);
    this.displayedColumns = this.dataBaseColumns.slice(0,10);
    this.displayedColumns.unshift('op','select');
    console.log(this.displayedColumns);
    console.log(this.dataSource)
    // this.dataSource.filterPredicate = function(data:any, filter: string): any {
    //   return data?.Route_Name.toLowerCase().includes(filter) ;
    // };
    this.dataSource.paginator = this.paginator;
    this.origin = this.locs[0];
    this.destination = this.locs[0];
    this.currentDate = new Date();
    this.currentTime = new Date();
    this.displayTime = this.formatAMPM(new Date());
    this.displayDate = new Date();
    this.map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
      zoom: 12,
      center: { lat: 43.651070, lng:  -79.347015 },
    }
    )
    this.directionsRenderer = new google.maps.DirectionsRenderer({ map: this.map, suppressMarkers: true });
    this.locs.map((location:any) => {
      if(location?.Location_ID!==this.origin?.Location_ID && location?.Location_ID!=this.destination?.Location_ID)  this.makemkrs({lat:parseFloat(location?.Latitude),lng:parseFloat(location?.Longitude)}, location?.Name,location?.Location_ID,location?.Route_Name)
    });
    this.makeClusters();
  }

  applyFilter(filterValue: any,column:any) {
    console.log(column);
    if(filterValue.target?.value == '') this.isFilterActive = false;
    else this.isFilterActive = true;
    this.dataSource.filterPredicate = function(data:any, filter: string): any {
     if(column == 'Route_Name') return data?.Route_Name.toLowerCase().includes(filter) ;
     else if(column == 'Address') return data?.Address.toLowerCase().includes(filter) ;
     else if(column == 'Name') return data?.Name.toLowerCase().includes(filter) ;
    };
    filterValue = filterValue.target?.value?.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    console.log(this.dataSource.filteredData)
    this.cdr.detectChanges();
  }

  clearAllFilters(){
    this.applyFilter('','');
    // this.filterName.target.value = '';
    this.filterName.nativeElement.value = '';
    this.filterAddress.nativeElement.value = '';
    this.filterRouteName.nativeElement.value = '';
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }


   isSelectedPage() {
    const numSelected = this.selection.selected.length;
    const page = this.dataSource.paginator?.pageSize;
    let endIndex: number;
  if(this.dataSource.paginator){
    if ( this.dataSource.data.length > (this.dataSource?.paginator?.pageIndex + 1) * this.dataSource.paginator.pageSize) {
      endIndex = (this.dataSource.paginator.pageIndex + 1) * this.dataSource.paginator.pageSize;
    } else {
      endIndex = this.dataSource.data.length - (this.dataSource.paginator.pageIndex * this.dataSource.paginator.pageSize);
    }
    this.masterCheckbox = numSelected === endIndex;
    return this.masterCheckbox;
  }
  else return false;    
  }

  masterToggle(event:any) {
   this.isSelectedPage() ?
      this.selection.clear() :
      this.selectRows();
  }



  onChangedPage(event:any){
    console.log(event);
    this.pageSizeperPage = event?.pageSize;
    this.masterCheckbox = false;
    if(this.selection.selected.length>0){
      const dialogRef = this.dialog.open(ConfirmBoxComponent, {
        data: {
          locations: `${this.selection?.selected?.length}`,
          destinationRoute: `${this.locs[0]?.Route_Name}`,
        }
      });
      dialogRef.afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed == true){
          this.logSelection();
          this.masterCheckbox = false;
          this.cdr.detectChanges();
        } 
        else {
          this.selection.clear();
          this.masterCheckbox = false;
        }
      });
    }
  }

   selectRows() {
    let endIndex: number;
    if(this.dataSource.paginator){
      if (this.dataSource.data.length > (this.dataSource.paginator.pageIndex + 1) * this.dataSource.paginator.pageSize) {
        endIndex = (this.dataSource.paginator.pageIndex + 1) * this.dataSource.paginator.pageSize;
      } else {
        endIndex = this.dataSource.data.length;
      }

      for (let index = (this.dataSource.paginator.pageIndex * this.dataSource.paginator.pageSize); index < endIndex; index++) {
        this.selection.select(this.dataSource.data[index]);
      }
    }    
  }

   deSelectRows() {
    let endIndex: number;
    if(this.dataSource.paginator){
      if (this.dataSource.data.length > (this.dataSource.paginator.pageIndex + 1) * this.dataSource.paginator.pageSize) {
        endIndex = (this.dataSource.paginator.pageIndex + 1) * this.dataSource.paginator.pageSize;
      } else {
        endIndex = this.dataSource.data.length;
      }

      for (let index = (this.dataSource.paginator.pageIndex * this.dataSource.paginator.pageSize); index < endIndex; index++) {
        this.selection.deselect(this.dataSource.data[index]);
      }
    }    
  }

  deleteWaypoint(loc:any){
    this.selectedLocations.map((item:any,idx:any)=>{
      if(loc.Location_ID==item.Location_ID) this.selectedLocations.splice(idx,1);
    });
    this.selection.clear();
  }

  deleteAllWaypoints(){
    const dialogRef = this.dialog.open(ConfirmBoxComponent, {
      data: {
        locations: `${this.selectedLocations?.length}`,
        destinationRoute: null,
      }
    });
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed == true){
        this.showRoutes = false;
        this.selectedLocations = [];
        this.selection.clear();
      }
      else this.selection.clear();
    });
  }

  editRoute(){
    this.showRoutes = !this.showRoutes;
  }

  selectaRow(row:any,ev:any){
    console.log(ev)
    if(ev?.checked) this.selection.select(row);
    else this.selection.deselect(row);
  }


  logSelection() {
    let count_addedLocations = 0;
    this.selection.selected.forEach((s:any ) =>{
      if( s?.Location_ID!=this.origin?.Location_ID && s?.Location_ID!=this.destination?.Location_ID ){
        const index = this.selectedLocations.findIndex((object:any) => (object?.Location_ID === s?.Location_ID ));
        if (index === -1){
          this.selectedLocations.push(s);
          count_addedLocations++;
        }
        else this.toastr.warning(`Location ${s?.Name} already exists in route`)
      }
      else this.toastr.warning(`The Location ${s?.Name} is either Origin or Destination`)
    });

    if(count_addedLocations==1 && count_addedLocations>0) ( (this.initiatedRoute == true) ? this.toastr.success(`Added ${count_addedLocations} more location to Route`) : this.toastr.success(`Added ${count_addedLocations} location to Route`));
    else if(count_addedLocations>1 && count_addedLocations>0) ( (this.initiatedRoute == true) ? this.toastr.success(`Added ${count_addedLocations} more locations to Route`) : this.toastr.success(`Added ${count_addedLocations} locations to Route`));
    console.log(this.selectedLocations);
    this.selection.clear();
    this.masterCheckbox = false;
    this.initiatedRoute = true;
  }

  navigationDrawer() {
    this.navigation = !this.navigation;
    this.showOverlay = !this.showOverlay;
  }

  toggleTableView(){
    this.tableview = !this.tableview;
  }

  public AddressChange(address: any) {
    this.formattedaddress = address.formatted_address;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      {
        address: this.formattedaddress
      },
      (results: any, status: any) => {
        console.log(status)
        if (status === "OK" && results.length > 0) {
          const firstResult = results[0].geometry;
          const bounds = new google.maps.LatLngBounds();
          if (firstResult.viewport) {
            bounds.union(firstResult.viewport);
          } else {
            bounds.extend(firstResult.location);
          }

          this.map.fitBounds(bounds);
        }
      }
    );
  }

  
  clearSearchArea(){
    this.sarea.nativeElement.value = "";
    this.map.setCenter(new google.maps.LatLng(43.651070,  -79.347015));
    this.map.setZoom(12);
  }

  setHomeasCurrentLoc() {
    this.isHomesetasCurrent = true;
    this.isHomesetasDefault = false;
    this.isHomesetasEditedLocation = false;
    this.isHomesetasFavourite = false;
    this.startstopmkr = [];
    // this.originMkr.setMap(null);
    this.origin = "St. Loius";
  }

  setEndasCurrentLoc() {
    this.isEndsetasCurrent = true;
    this.isEndsetasDefault = false;
    this.isEndsetasEditedLocation = false;
    this.isEndsetasFavourite = false;
    this.startstopmkr = [];
    this.destination = "Edmonton";
  }

  formatAMPM(date: any) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    let strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  }

  getformatted24hrs() {
    let date = new Date();
    let hours:any = date.getHours();
    let minutes:any = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours < 10 ? ('0'+hours) : hours;
    minutes = minutes < 10 ? ('0'+minutes) : minutes;
    let strTime = hours + ':' + minutes ;
    return strTime;
  }

  timeFromMins(mins:any) {
    function z(n:any){return (n<10? '0':'') + n;}
    var h = (mins/60 |0) % 24;
    var m = mins % 60;
    return z(h.toFixed(2)) + ':' + z(m.toFixed(2));
  }

  addbyMoment(secs:any){
    const number = moment(this.displayTime, ["hh:mm A"]).add(secs,'seconds').format("h:mm A");
    return number;
  }

  dateChange(event: any): void {
    // this.initialLoader = true;
    let date = event.value || event;
    this.displayDate = date;
    const yyyy = date.getFullYear();
    let mm: any = date.getMonth() + 1; // Months start at 0!
    let dd: any = date.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    const formattedDate = { "date": mm + '-' + dd + '-' + yyyy };
  }

  onTimeset(ev: any) {
    let time = ev?.value || ev;
    this.displayTime = time;
  }

  leftDateClick(): void {
    const numOfDays = 1;
    const daysAgo = new Date(this.displayDate.getTime());
    daysAgo.setDate(this.displayDate.getDate() - numOfDays);
    this.dateChange(daysAgo);
  }

  rightDateClick(): void {
    const numOfDays = 1;
    const daysAgo = new Date(this.displayDate.getTime());
    daysAgo.setDate(this.displayDate.getDate() + numOfDays);
    this.dateChange(daysAgo);
  }


  makeMarker(position: any, icon: any, title: any, locObject: any) {
    this.startstopmkr = [];
    let label = title + "";
    console.log(position.lat());
    let obj = { lat: position.lat(), lng: position.lng() };
    if (icon == "start") {
      this.originMkr = new google.maps.Marker({
        position: obj,
        map: this.map,
        icon: "assets/flag-start.png",
        label: title,
        title: title
      });
      google.maps.event.addListener(this.originMkr, 'click', (evt: any) => {
        this.infoWin.setContent(`<div style= "padding:10px"> <p style="font-weight:400;font-size:13px">Location &emsp;  : &emsp; ${label}  <p> <p style="font-weight:400;font-size:13px"> Address  &emsp;  : &emsp; ${locObject?.start_address} </p> <p style="font-weight:400;font-size:13px"> Route  &emsp;&emsp;  : &emsp;  <i> Empty </i> </p>
                      <div style="display:flex;align-items:center; justify-content:center;flex-wrap:wrap; gap:5%; color:rgb(62, 95, 214);font-weight:400;font-size:12px" > <div>Remove</div> <div>G Map</div> <div>Street View</div>  <div>Move</div><div>
                    </div>`);
        this.infoWin.open(this.map, this.originMkr);
      });
      this.originMkr.setMap(this.map)
      this.startstopmkr.push(this.originMkr);
      new MarkerClusterer(this.map, this.startstopmkr, {
        imagePath:
          "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
      });
    }
    else {
      this.destMkr = new google.maps.Marker({
        position: obj,
        map: this.map,
        icon: "assets/flag-end.png",
        label: label,
        title: title
      });

      google.maps.event.addListener(this.destMkr, 'click', (evt: any) => {
        this.infoWin.setContent(`<div style= "padding:10px"> <p style="font-weight:400;font-size:13px">Location &emsp;  : &emsp; ${label}  <p> <p style="font-weight:400;font-size:13px"> Address  &emsp;  : &emsp; ${locObject?.start_address} </p> <p style="font-weight:400;font-size:13px"> Route  &emsp;&emsp;  : &emsp;  <i> Empty </i> </p>
                      <div style="display:flex;align-items:center; justify-content:center;flex-wrap:wrap; gap:5%; color:rgb(62, 95, 214);font-weight:400;font-size:12px" > <div>Remove</div> <div>G Map</div> <div>Street View</div>  <div>Move</div><div>
                    </div>`);
        this.infoWin.open(this.map, this.destMkr);
      })
      this.destMkr.setMap(this.map);
      this.startstopmkr.push(this.destMkr);
      new MarkerClusterer(this.map, this.startstopmkr, {
        imagePath:
          "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",

      });
    }
  }

  makemkrs(position: any, title: any,loc_id:any,route_name:any) {
    let label = title + "";
    let markerIcon = {
      url: 'assets/pin.png',
      scaledSize: new google.maps.Size(30, 30),
      labelOrigin:  new google.maps.Point(-30,10),
    };
    let obj = position;
    let marker = new google.maps.Marker({
      position: obj,
      map: this.map,
      icon:markerIcon,
      label: {text:title,color: "#1440de",fontSize: "11px",fontWeight:'600',className:'marker-position'},
            
    });
    google.maps.event.addListener(marker, 'click', (evt: any) => {
      this.infoWin.setContent(`<div style= "padding:10px"> <p style="font-weight:400;font-size:13px">Location &emsp;  : &emsp; ${loc_id}  <p> <p style="font-weight:400;font-size:13px"> Address  &emsp;  : &emsp; ${title} </p> <p style="font-weight:400;font-size:13px"> Route  &emsp;&emsp;  : &emsp;  <i> ${route_name} </i> </p>
      <div style="display:flex;align-items:center; justify-content:center;flex-wrap:wrap; gap:5%; color:rgb(62, 95, 214);font-weight:400;font-size:12px" > <div>
    </div>`);
      this.infoWin.open(this.map, marker);
    })
    this.mkrs.push(marker);
  }

  buildRoute() {
    this.wayPoints = [];
     this.selectedLocations.map((loc:any,index:any) => {
      if(loc.Location_ID != this.origin.Location_ID && loc.Location_ID != this.destination.Location_ID){
        let obj = { lat:parseFloat(loc?.Latitude),lng:parseFloat(loc.Longitude)}
     this.wayPoints.push(obj)
      }
    });
    this.wayPoints.unshift({lat:parseFloat(this.origin?.Latitude),lng:parseFloat(this.origin.Longitude)});
    this.wayPoints.push({lat:parseFloat(this.destination?.Latitude),lng:parseFloat(this.destination.Longitude)});
    console.log(this.wayPoints);
    var stations = this.wayPoints;
    let service = new google.maps.DirectionsService();
    var map = this.map;

    // Zoom and center map automatically by stations (each station will be in visible map area)
    var lngs = stations.map(function(station:any) { return station.lng; });
    var lats = stations.map(function(station:any) { return station.lat; });
    map.fitBounds({
        west: Math.min.apply(null, lngs),
        east: Math.max.apply(null, lngs),
        north: Math.min.apply(null, lats),
        south: Math.max.apply(null, lats),
    });

   

    // Divide route to several parts because max stations limit is 25 (23 waypoints + 1 origin + 1 destination)
    for (var i = 0, parts = [], max = 25 - 1; i < stations.length; i = i + max)
        parts.push(stations.slice(i, i + max + 1));

    // Service callback to process service results
    var service_callback = (response:any, status:any)=> {
        if (status != 'OK') {
            console.log('Directions request failed due to ' + status);
            return;
        }
        else{
          this.result = response;
          // this.shortestResult = this.shortestRoute(this.result);
          console.log(response.routes);
          response.routes[0].legs.map((leg:any,idx:any)=>{
          
            if(idx!=0){
              // leg.cummulative = this.result.routes[0].legs[idx - 1].cummulative + leg?.duration?.value;
              leg.cummulativeWithNoInterval = response.routes[0].legs[idx - 1].cummulative + response.routes[0].legs[idx-1]?.duration?.value;
              leg.cummulative = leg.cummulativeWithNoInterval + 1800;
            }
            else{
              leg.cummulativeWithNoInterval = 0;
              leg.cummulative = leg.cummulativeWithNoInterval;
            }
          })
          console.log(this.shortestRte);
          let legLength = this.result.routes[0].legs.length;
          var leg = this.result.routes[0].legs[0];
          var leg2 = this.result.routes[0].legs[legLength - 1];
          this.makeMarker(leg.start_location, "start", leg.start_location, leg);
          this.makeMarker(leg2.end_location, "end", leg2.end_location, leg2);
          this.computeTotalDistance(response);
          this.showRoutes = true;
        }
        var renderer = new google.maps.DirectionsRenderer;
        renderer.setMap(map);
        renderer.setOptions({ suppressMarkers: true, preserveViewport: true });
        renderer.setDirections(response);
        this.showRoutes = true;
    };

    // Send requests to service to get route (for stations count <= 25 only one request will be sent)
    for (var i = 0; i < parts.length; i++) {
        // Waypoints does not include first station (origin) and last station (destination)
        var waypoints = [];
        for (var j = 0; j < parts[i].length; j++)
            waypoints.push({location: parts[i][j], stopover: false});
        // Service options
        let service_options:any = {
            origin: parts[i][0],
            destination: parts[i][parts[i].length - 1],
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.DRIVING
        };
        // Send request
        service.route(service_options, service_callback);
    }
  }

  markLocations() {
    for (var i = 0, parts = [], max = 25 - 1; i < this.selectedLocations.length; i = i + max) {
      parts.push(this.selectedLocations.slice(i, i + max + 1));
    }
    // Send requests to service to get route (for stations count <= 25 only one request will be sent)
    for (var i = 0; i < parts.length; i++) {
      // Waypoints does not include first station (origin) and last station (destination)
      for (var j = 1; j < parts[i].length - 1; j++) {
        this.wayPoints.push(parts[i][j]);
      }
    }
  }

  renderRoute() {
    this.directionsRenderer?.setDirections(this.shortestResult); // shortest or result
    this.showRoutes = true;
  }

  computeTotalDistance(result: any) {
    var totalDist = 0;
    var totalTime = 0;
    var myroute = result.routes[0];
    for (let i = 0; i < myroute.legs.length; i++) {
      totalDist += myroute.legs[i].distance.value;
      totalTime += myroute.legs[i].duration.value;
    }
    totalDist = totalDist / 1000.
    console.log("total distance is: " + totalDist + " km<br>total time is: " + (totalTime / 60).toFixed(2) + " minutes");
    this.totalDistance = totalDist;
    this.totalDuration = this.secondsToDhms(totalTime.toFixed(2));
  }

  secondsToDhms(seconds: any) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " d " : " d ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " h " : " h ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " min " : " mins ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " seconds" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay ;
  }

  makeClusters() {
    console.log(this.mkrs)
    var mkrClusters = new MarkerClusterer(this.map, this.mkrs, {
      imagePath:
        "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",

    });
  }

  shortestRoute(routeResults: google.maps.DirectionsResult | any) {
    if (routeResults.routes[0]) this.shortestRte = routeResults.routes[0];
    if (this.shortestRte) var shortestLength = this.shortestRte.legs[0].distance.value;
    for (var i = 1; i < routeResults.routes.length; i++) {
      if (routeResults.routes[i].legs[0].distance.value < shortestLength) {
        this.shortestRte = routeResults.routes[i];
        shortestLength = routeResults.routes[i].legs[0].distance.value;
      }
    }
    routeResults.routes = [this.shortestRte];
    this.showRoutes = true;
    return routeResults;
  }

  

 
}