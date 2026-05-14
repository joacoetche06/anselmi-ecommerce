import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-success.html',
})
export class OrderSuccess implements OnInit {
  orderId: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Capturamos el ID que puede venir por parámetro
    this.orderId = this.route.snapshot.queryParamMap.get('id');
  }
}
