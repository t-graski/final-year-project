import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLoginAuditTab } from './admin-login-audit-tab';

describe('AdminLoginAuditTab', () => {
  let component: AdminLoginAuditTab;
  let fixture: ComponentFixture<AdminLoginAuditTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLoginAuditTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminLoginAuditTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
