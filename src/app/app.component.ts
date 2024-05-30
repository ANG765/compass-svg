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
  // Radius
  radiusChange = false;
  // Compass size
  heightCompass = 301.5;
  widthCompass = 53;
  centerCompass = { x: 21, y: 70 };
  rotationCenterOfLegs = { x: 21, y: 52 };
  widthLegs = 15;
  lengthLegs = 231.5;
  // Rotation position / Randian = angle of rotation
  legRotationRadian = 0;
  originalMousePosition: Position | undefined;
  rotationCenter: Rotation;
  rotationRotatedCenter: Position;
  penPosition: Position;

  transformLegs: {right:string;left:string,calculatedEnd?:Position} = {right:'',left:''};

  constructor() {
    this.legRotationRadian = 2 * Math.PI;
    this.rotationCenter = this.calculateLeftLegEndOld();
    this.rotationRotatedCenter = this.calculateRotatedLeftLegEnd();
    this.penPosition = this.calculateRightLegEnd();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.dragging && !this.rotating && !this.radiusChange) {
      this.onDrag(event);
    } else if (this.dragging && this.rotating && !this.radiusChange) {
      this.onRotation(event);
    } else if (this.dragging && !this.rotating && this.radiusChange) {
      this.onRadiusChange(event);
    }
  }

  @HostListener('document:mouseup')
  onDragEnd() {
    this.dragging = false;
    this.rotating = false;
    this.radiusChange = false;
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

  // From here is the mathematical part extracted from the old project
  onRadiusChangeStart(event: MouseEvent) {
    this.radiusChange = true;
    // this.rotationStartedX = event.clientX - this.offsetX;
    // this.rotationStartedY = event.clientY - this.offsetY;
    event.preventDefault();
  }

  onRotation(event: MouseEvent) {
    // const newRadian = this.getRotationRadian(this.rotationCenter, event);
    const rotationCenterWithOffset = {
      x: this.offsetX + this.rotationCenter.x,
      y: this.offsetY + this.rotationCenter.y
    }

    console.log(this.offsetX, this.rotationCenter.x);
    
    const radians = Math.atan2(event.pageX - rotationCenterWithOffset.x, event.pageY - rotationCenterWithOffset.y);
    const newRadian = (radians * (180 / Math.PI) * -1) -180;

    this.rotationAngle = newRadian;

    console.log('new:',this.calculateLeftLegEndOld(), 'old:',this.calculateLeftLegEnd())

    this.getTransform();
  }

  onRadiusChange(event: MouseEvent){
    const currentLegX = this.calculateLeftLegEnd().x;
    const currentLegY = this.calculateLeftLegEnd().y;
    const rotationCenterWithOffset = {
      x: this.offsetX + this.centerCompass.x,
      y: this.offsetY + this.centerCompass.y
    }
    
    const radians = Math.atan2(event.pageX - rotationCenterWithOffset.x, event.pageY - rotationCenterWithOffset.y) * -1;
  
    //prevent the legs from crossing:
    if(radians>0) return;

    const newRadian = (radians * (180 / Math.PI));
    this.legRotationRadian = radians + 0;
    this.transformLegs = {
      right:`rotate(${newRadian/2},${this.centerCompass.x},${this.centerCompass.y})`,
      left:`rotate(${newRadian/-2},${this.centerCompass.x},${this.centerCompass.y})`,
      calculatedEnd:this.calculateLeftLegEnd()
    }
    this.offsetX += currentLegX - this.calculateLeftLegEnd().x;
    // this.offsetY += currentLegY - this.calculateLeftLegEnd().y;
    console.log(this.offsetY , currentLegY , this.calculateLeftLegEnd().y);
    this.getTransform(); 
  }

  getTransform() {
    this.transformStyles = '';
    if (this.offsetX || this.offsetY) {
      this.transformStyles +=
        'translate(' + this.offsetX + ',' + this.offsetY + ')';
    }
    this.transformStyles +=
      ' rotate(' + this.rotationAngle +')';
  }

  calculateLeftLegEnd() {
    const rotationCenterWithOffset = {
      x: this.offsetX + this.centerCompass.x,
      y: this.offsetY + this.centerCompass.y
    }

    let alpha = 2 * Math.PI - this.legRotationRadian/2;
    alpha %= 2 * Math.PI;

    const x = this.lengthLegs * Math.sin(this.legRotationRadian/2+Math.PI);
    const y = this.lengthLegs * Math.cos(this.legRotationRadian/2+Math.PI);

    console.log(y);
    return {
      x: rotationCenterWithOffset.x - x,
      y: rotationCenterWithOffset.y - y,
      radian: undefined,
    };
  }

  calculateLeftLegEndOld() {
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
