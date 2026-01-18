import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileInfoTabComponent } from './profile-info-tab.component';

describe('ProfileInfoTabComponent', () => {
  let component: ProfileInfoTabComponent;
  let fixture: ComponentFixture<ProfileInfoTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileInfoTabComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileInfoTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
