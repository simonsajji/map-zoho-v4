import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastrServices {

  constructor(private toastr: ToastrService) { }

  success(message:any) {
    console.log(message)
    this.toastr.success(message);
  }

  warning(message:any){
    this.toastr.warning(message);
  }

  info(message:any){
    this.toastr.info(message);
  }

  error(message:any){
    this.toastr.error(message);
  }
}
