import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Position } from './interfaces/position.interface';
import { Rotation } from './interfaces/rotation.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class CompassComponent {
  @ViewChild('leftLegTip', { static: true }) leftLegTip: ElementRef | undefined;
  @ViewChild('rotateTip', { static: true }) rotateTip: ElementRef | undefined;

  dragging = false;
  dragStartX = 0;
  dragStartY = 0;
  offsetX = 0;
  offsetY = 0;

  rotating = false;
  rotationAngle = 0;
  rotationStartedX = 0;
  rotationStartedY = 0;
  transformStyles = '';

  radiusChange = false;

  // Constants for compass dimensions and positions
  readonly heightCompass = 301.5;
  readonly widthCompass = 53;
  readonly centerCompass: Position = { x: 21, y: 70 };
  readonly rotationCenterOfLegs: Position = { x: 21, y: 52 };
  readonly widthLegs = 15;
  readonly lengthLegs = 231.5;

  legRotationRadian = 0;
  originalMousePosition: Position | undefined;
  rotationCenter: Rotation | undefined;
  rotationRotatedCenter: Position | undefined;
  penPosition: Position | undefined;

  transformLegs: { right: string; left: string; calculatedEnd?: Position } = { right: '', left: '' };

  constructor() {
    this.initializeCompass();
  }

  // Initialize the compass properties
  private initializeCompass(): void {
    this.legRotationRadian = 0;
    this.rotationCenter = this.calculateLeftLegEndOld();
    this.rotationRotatedCenter = this.calculateRotatedLeftLegEnd();
    this.penPosition = this.calculateRightLegEnd();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.dragging && !this.rotating && !this.radiusChange) {
      this.onDrag(event);
    } else if (this.dragging && this.rotating && !this.radiusChange) {
      this.onRotation(event);
    } else if (this.dragging && !this.rotating && this.radiusChange) {
      this.onRadiusChange(event);
    }
  }

  @HostListener('document:mouseup')
  onDragEnd(): void {
    this.dragging = false;
    this.rotating = false;
    this.radiusChange = false;
  }

  onDrag(event: MouseEvent): void {
    this.offsetX = event.clientX - this.dragStartX;
    this.offsetY = event.clientY - this.dragStartY;
    this.getTransform();
  }

  onDragStart(event: MouseEvent): void {
    this.dragging = true;
    this.dragStartX = event.clientX - this.offsetX;
    this.dragStartY = event.clientY - this.offsetY;
    event.preventDefault();
  }

  onRotationStart(event: MouseEvent): void {
    this.rotating = true;
    this.rotationStartedX = event.clientX - this.offsetX;
    this.rotationStartedY = event.clientY - this.offsetY;
    event.preventDefault();
  }

  onRadiusChangeStart(event: MouseEvent): void {
    this.radiusChange = true;
    this.originalMousePosition = { x: event.clientX, y: event.clientY };
    event.preventDefault();
  }

  onRotation(event: MouseEvent): void {
    const rotationCenterWithOffset = {
      x: this.offsetX + (this.rotationCenter?.x || 0),
      y: this.offsetY + (this.rotationCenter?.y || 0),
    };

    const radians = Math.atan2(event.pageX - rotationCenterWithOffset.x, event.pageY - rotationCenterWithOffset.y);
    const newRadian = (radians * (180 / Math.PI) * -1) - 180;

    this.rotationAngle = newRadian;
    this.getTransform();
  }

  onRadiusChange(event: MouseEvent): void {
    const rotationCenterWithOffset = {
      x: this.offsetX + this.centerCompass.x,
      y: this.offsetY + this.centerCompass.y,
    };

    const deltaX = event.clientX - (this.originalMousePosition?.x || 0);
    const deltaY = event.clientY - (this.originalMousePosition?.y || 0);

    const deltaDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const angleChange = deltaDistance / (this.lengthLegs / 2);

    const newRadian = deltaX > deltaY ? -angleChange : angleChange;

    this.legRotationRadian += newRadian;

    const maxLegRotation = -(120 * (Math.PI / 180));
    const minLegRotation = 0;
    this.legRotationRadian = Math.min(Math.max(this.legRotationRadian, maxLegRotation), minLegRotation);

    const newAngleDegrees = this.legRotationRadian * (180 / Math.PI);

    this.transformLegs = {
      right: `rotate(${newAngleDegrees / 2},${this.centerCompass.x},${this.centerCompass.y})`,
      left: `rotate(${newAngleDegrees / -2},${this.centerCompass.x},${this.centerCompass.y})`,
      calculatedEnd: this.calculateLeftLegEnd(),
    };

    this.originalMousePosition = { x: event.clientX, y: event.clientY };

    this.getTransform();
  }

  getTransform(): void {
    this.transformStyles = '';
    if (this.offsetX || this.offsetY) {
      this.transformStyles += `translate(${this.offsetX},${this.offsetY})`;
    }
    this.transformStyles += ` rotate(${this.rotationAngle})`;
  }

  calculateLeftLegEnd(): Position {
    const rotationCenterWithOffset = {
      x: this.offsetX + this.centerCompass.x,
      y: this.offsetY + this.centerCompass.y,
    };

    const alpha = this.legRotationRadian / 2;
    const x = this.lengthLegs * Math.sin(alpha + Math.PI);
    const y = this.lengthLegs * Math.cos(alpha + Math.PI);

    return {
      x: rotationCenterWithOffset.x - x,
      y: rotationCenterWithOffset.y - y,
    };
  }

  calculateLeftLegEndOld(): Rotation {
    const alpha = 2 * Math.PI - this.legRotationRadian;
    const x = this.lengthLegs * Math.sin(alpha);
    const y = this.lengthLegs * Math.cos(alpha);

    return {
      x: this.centerCompass.x - this.widthLegs - x,
      y: this.centerCompass.y + y,
      radian: undefined
    };
  }

  calculateRotatedLeftLegEnd(): Position {
    const alpha = 2 * Math.PI - this.legRotationRadian * 2;
    const x = this.lengthLegs * Math.sin(alpha);
    const y = this.lengthLegs * Math.cos(alpha);

    return {
      x: this.centerCompass.x - this.widthLegs - x,
      y: this.centerCompass.y + y,
    };
  }

  calculateRightLegEnd(): Position {
    const alpha = this.legRotationRadian;
    const x = this.lengthLegs * Math.sin(alpha);
    const y = this.lengthLegs * Math.cos(alpha);

    return {
      x: this.centerCompass.x + this.widthLegs - x,
      y: this.centerCompass.y + y,
    };
  }
}

