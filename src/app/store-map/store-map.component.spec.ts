import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreMapComponent } from './store-map.component';

describe('StoreMapComponent', () => {
  let component: StoreMapComponent;
  let fixture: ComponentFixture<StoreMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoreMapComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoreMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
