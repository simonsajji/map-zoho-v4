import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-box',
  templateUrl: './confirm-box.component.html',
  styleUrls: ['./confirm-box.component.css']
})
export class ConfirmBoxComponent implements OnInit {
  message: string = "";
  datanew : any;
  constructor(
    @Inject(MAT_DIALOG_DATA) private data: any,
    private dialogRef: MatDialogRef<ConfirmBoxComponent>
    ) {
    if (data) {
      this.message = data.message || this.message;
      this.datanew = data;
    }
    // this.dialogRef.updateSize('300vw','300vw')
  }

  ngOnInit(): void{ }

  okClick(): void {
    this.dialogRef.close(true);
  }

  cancelClick(): void {
    this.dialogRef.close(false);
  }

}
