import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Position } from './interfaces/position.interface';
import { Rotation } from './interfaces/rotation.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class CompassComponent {
  @ViewChild('leftLegTip', { static: true }) leftLegTip: ElementRef | undefined;
  @ViewChild('rotateTip', { static: true }) rotateTip: ElementRef | undefined;

  // Drag and drop
  dragging = false;
  dragStartX = 0;
  dragStartY = 0;
  offsetX = 0;
  offsetY = 0;
  // Rotation
  rotating = false;
  rotationAngle = 0;
  rotationPosition: Position | undefined;
  rotationStartedX = 0;
  rotationStartedY = 0;
  transformStyles = '';
  // Compass size
  heightCompass = 301.5;
  widthCompass = 53;
  centerCompass = { x: 21, y: 70 };
  rotationCenterOfLegs = { x: 21, y: 52 };
  widthLegs = 3;
  lengthLegs = 231.5;
  // Rotation position / Randian = angle of rotation
  legRotationRadian = 0;
  originalMousePosition: Position | undefined;
  rotationCenter: Rotation;
  rotationRotatedCenter: Position;
  penPosition: Position;

  constructor() {
    this.legRotationRadian = 2 * Math.PI;
    this.rotationCenter = this.calculateLeftLegEnd();
    this.rotationRotatedCenter = this.calculateRotatedLeftLegEnd();
    this.penPosition = this.calculateRightLegEnd();

    // Test: Make compass rotate
    /* 
    setInterval(() => {
       if(this.rotationAngle === 360) {
         this.rotationAngle = 0;
       }
       this.rotationAngle += 1;
       this.getTransform();
    }, 75);
    */
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.dragging && !this.rotating) {
      this.onDrag(event);
    } else if (this.dragging && this.rotating) {
      this.onRotation(event);
    }
  }

  @HostListener('document:mouseup')
  onDragEnd() {
    this.dragging = false;
    this.rotating = false;
  }

  onDrag(event: MouseEvent) {
    this.offsetX = event.clientX - this.dragStartX;
    this.offsetY = event.clientY - this.dragStartY;
    this.getTransform();
  }

  onDragStart(event: MouseEvent) {
    this.dragging = true;
    this.dragStartX = event.clientX - this.offsetX;
    this.dragStartY = event.clientY - this.offsetY;
    event.preventDefault();
  }

  // From here is the mathematical part extracted from the old project
  onRotationStart(event: MouseEvent) {
    this.rotating = true;
    this.rotationStartedX = event.clientX - this.offsetX;
    this.rotationStartedY = event.clientY - this.offsetY;
    event.preventDefault();
  }

  onRotation(event: MouseEvent) {
    const newRadian = this.getRotationRadian(this.rotationCenter, event);

    this.rotationAngle = newRadian;

    this.getTransform();
  }

  getTransform() {
    this.transformStyles = '';
    if (this.offsetX || this.offsetY) {
      this.transformStyles +=
        'translate(' + this.offsetX + ',' + this.offsetY + ')';
    }
    this.transformStyles +=
      ' rotate(' + this.rotationAngle + ',' + this.rotationCenter.x + ',' + this.rotationCenter.y + ')';
  }

  calculateLeftLegEnd() {
    let alpha = 2 * Math.PI - this.legRotationRadian;
    alpha %= 2 * Math.PI;

    const x = this.lengthLegs * Math.sin(alpha);
    const y = this.lengthLegs * Math.cos(alpha);

    return {
      x: this.centerCompass.x - this.widthLegs - x,
      y: this.centerCompass.y + y,
      radian: undefined,
    };
  }

  calculateRotatedLeftLegEnd() {
    let alpha = 2 * Math.PI - this.legRotationRadian * 2;
    alpha %= 2 * Math.PI;

    const x = this.lengthLegs * Math.sin(alpha);
    const y = this.lengthLegs * Math.cos(alpha);

    return {
      x: this.centerCompass.x - this.widthLegs - x,
      y: this.centerCompass.y + y,
    };
  }

  calculateRightLegEnd() {
    let alpha = this.legRotationRadian;
    alpha %= 2 * Math.PI;

    const x = this.lengthLegs * Math.sin(alpha);
    const y = this.lengthLegs * Math.cos(alpha);

    return {
      x: this.centerCompass.x + this.widthLegs - x,
      y: this.centerCompass.y + y,
    };
  }

  getRotationRadian(rotationCenter: Rotation, event: MouseEvent) {
    const { radian, originalMousePosition } = this.getNewRotationRadian({
      rotationCenter: rotationCenter,
      oldRadian: this.rotationAngle,
      originalMousePosition: this.originalMousePosition,
      x: event.clientX,
      dx: this.rotationStartedX,
      y: event.clientY,
      dy: this.rotationStartedY,
    });
    this.originalMousePosition = originalMousePosition;

    return radian;
  }

  getNewRotationRadian({ rotationCenter, oldRadian, originalMousePosition, x, dx, y, dy }: any) {
    let originalPosition;
    const currentPosition = { x: x, y: y };

    if (originalMousePosition) {
      originalPosition = originalMousePosition;
    } else {
      originalPosition = { x: x - dx, y: y - dy };
    }

    const originalAngleToAxis = this.angleBetween(
      rotationCenter,
      originalPosition
    );
    const currentAngleToAxis = this.angleBetween(
      rotationCenter,
      currentPosition
    );
    const newRadian = currentAngleToAxis - originalAngleToAxis;
    let radian = oldRadian;
    if (newRadian < Math.PI / 2 && newRadian > -Math.PI / 2) {
      radian = oldRadian + newRadian;
      if (radian < 0) {
        radian += 2 * Math.PI;
      }
      radian %= 2 * Math.PI;
    }
    return {
      radian: radian,
      originalMousePosition: originalPosition,
    };
  }
  angleBetween(p1: Position, p2: Position) {
    if (p1.x === p2.x && p1.y === p2.y) {
      return Math.PI / 2;
    }
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }
}
