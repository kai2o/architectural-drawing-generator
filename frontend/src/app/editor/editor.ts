import { Component, signal, computed, effect, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';

// Types for workspace state
interface Floor {
  id: string;
  name: string;
  index: number;
  walls: Wall[];
  rooms: Room[];
  thumbnail?: string; // Base64 thumbnail preview
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  vendor?: string;
}

interface SelectedItem {
  type: string;
  id?: string;
  length?: number;
  width?: number;
  height?: number;
  rotation?: number;
  roomType?: string;
  layer?: string;
  clearance?: number;
}

// 2D Drawing Types
interface Point {
  x: number;
  y: number;
}

interface Wall {
  id: string;
  start: Point;
  end: Point;
  length: number;
  thickness?: number;
}

interface Room {
  id: string;
  points: Point[];
  area: number;
  roomType?: string;
  center: Point;
}

type ViewMode = '2d' | '3d';
type ActiveTool = 'select' | 'wall' | 'door' | 'window' | 'column' | 'staircase' | 'room' | 'partition' | 'measure';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor implements AfterViewInit {
  @ViewChild('canvasSvg', { static: false }) canvasSvg!: ElementRef<SVGElement>;
  @ViewChild('canvasContainer', { static: false }) canvasContainer!: ElementRef<HTMLDivElement>;

  // View State
  viewMode = signal<ViewMode>('2d');
  activeTool = signal<ActiveTool>('select');
  snapEnabled = signal<boolean>(true);
  gridSize = signal<number>(50); // cm
  measurementUnit = signal<'metric' | 'imperial'>('metric');
  
  // Floor Management
  floors = signal<Floor[]>([
    { id: '1', name: 'Ground Floor', index: 0, walls: [], rooms: [] }
  ]);
  currentFloorIndex = signal<number>(0);
  
  // Inspector Panel
  inspectorCollapsed = signal<boolean>(false);
  selectedItem = signal<SelectedItem | null>(null);
  
  // Catalog Panel
  catalogCollapsed = signal<boolean>(false);
  catalogSearch = signal<string>('');
  catalogCategory = signal<string>('');
  catalogVendor = signal<string>('');
  catalogItems = signal<CatalogItem[]>([]); // Empty for now, will be populated in Task 15
  
  // Undo/Redo Stack
  undoStack = signal<any[]>([]);
  redoStack = signal<any[]>([]);
  
  // Computed properties
  canUndo = computed(() => this.undoStack().length > 0);
  canRedo = computed(() => this.redoStack().length > 0);
  
  // Zoom level
  zoomLevel = signal<number>(1);

  // 2D Drawing State - computed from current floor
  walls = computed(() => {
    const floor = this.floors()[this.currentFloorIndex()];
    return floor ? floor.walls : [];
  });
  
  rooms = computed(() => {
    const floor = this.floors()[this.currentFloorIndex()];
    return floor ? floor.rooms : [];
  });
  isDrawing = signal<boolean>(false);
  currentWallStart = signal<Point | null>(null);
  currentWallEnd = signal<Point | null>(null);
  canvasOffset = signal<Point>({ x: 0, y: 0 });
  canvasPan = signal<Point>({ x: 0, y: 0 });
  showGrid = signal<boolean>(true);
  
  // Room type options
  roomTypes = [
    { value: 'bedroom', label: 'Bedroom' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'living', label: 'Living Room' },
    { value: 'bathroom', label: 'Bathroom' },
    { value: 'office', label: 'Office' },
    { value: 'meeting', label: 'Meeting Room' },
    { value: 'server', label: 'Server Room' },
    { value: 'mandir', label: 'Mandir' },
    { value: 'dining', label: 'Dining Room' },
    { value: 'hallway', label: 'Hallway' },
    { value: 'storage', label: 'Storage' },
    { value: 'other', label: 'Other' }
  ];

  // Computed: Total area of all rooms
  totalArea = computed(() => {
    return this.rooms().reduce((sum, room) => sum + room.area, 0);
  });

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    // Initialize with sample catalog items for placeholder
    // This will be replaced with actual data in Task 15
    this.catalogItems.set([
      { id: '1', name: 'Sample Chair', category: 'furniture', vendor: 'IKEA' },
      { id: '2', name: 'Sample Table', category: 'furniture', vendor: 'Local Vendor' },
      { id: '3', name: 'Sample Lamp', category: 'lighting', vendor: 'IKEA' },
    ]);

    // Effect to update canvas when grid size changes (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        if (this.viewMode() === '2d') {
          this.updateGrid();
        }
      });

      // Effect to generate thumbnails when floor data changes
      effect(() => {
        const floors = this.floors();
        const currentIndex = this.currentFloorIndex();
        
        // Generate thumbnail for current floor after a short delay
        if (floors.length > 0 && currentIndex >= 0 && currentIndex < floors.length) {
          const floor = floors[currentIndex];
          // Only generate if floor has geometry and no thumbnail yet
          if ((floor.walls.length > 0 || floor.rooms.length > 0) && !floor.thumbnail) {
            setTimeout(() => {
              this.generateFloorThumbnail(currentIndex).then(thumbnail => {
                if (thumbnail) {
                  const updatedFloor = { ...floor, thumbnail };
                  this.updateFloorData(currentIndex, updatedFloor);
                }
              });
            }, 500); // Delay to allow rendering to complete
          }
        }
      });
    }
  }

  ngAfterViewInit(): void {
    if (this.viewMode() === '2d') {
      setTimeout(() => {
        this.initializeCanvas();
        this.setupResizeObserver();
      }, 100);
    }
  }

  setupResizeObserver(): void {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (!this.canvasContainer) return;
    
    const container = this.canvasContainer.nativeElement;
    if (!container || typeof container.getBoundingClientRect !== 'function') {
      // Fallback to window resize if container isn't ready
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', () => {
          this.initializeCanvas();
        });
      }
      return;
    }
    
    // Use ResizeObserver if available, otherwise fallback to window resize
    if (typeof ResizeObserver !== 'undefined') {
      try {
        const observer = new ResizeObserver(() => {
          this.initializeCanvas();
        });
        observer.observe(container);
      } catch (error) {
        console.warn('Error setting up ResizeObserver:', error);
        if (typeof window !== 'undefined') {
          window.addEventListener('resize', () => {
            this.initializeCanvas();
          });
        }
      }
    } else {
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', () => {
          this.initializeCanvas();
        });
      }
    }
  }

  // View Mode Controls
  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    // When switching to 3D, we'll need to convert 2D geometry
    if (mode === '3d') {
      console.log('Switching to 3D mode - geometry conversion will happen here');
    } else if (mode === '2d') {
      // Reinitialize canvas when switching back to 2D
      setTimeout(() => this.initializeCanvas(), 0);
    }
  }

  // Tool Selection
  setActiveTool(tool: ActiveTool): void {
    this.activeTool.set(tool);
    // Clear selection when changing tools
    if (tool !== 'select') {
      this.selectedItem.set(null);
    }
  }

  // Snap & Grid Controls
  toggleSnap(): void {
    this.snapEnabled.update(value => !value);
  }

  toggleGrid(): void {
    this.showGrid.update(value => !value);
    this.updateGrid();
  }

  // Floor Management
  addFloor(): void {
    const newFloor: Floor = {
      id: `${Date.now()}`,
      name: `Floor ${this.floors().length + 1}`,
      index: this.floors().length,
      walls: [],
      rooms: []
    };
    this.floors.update(floors => [...floors, newFloor]);
    this.switchFloor(this.floors().length - 1);
  }

  switchFloor(index: number): void {
    if (index >= 0 && index < this.floors().length) {
      // Save current floor state before switching
      this.saveCurrentFloorState();
      
      // Switch to new floor
      this.currentFloorIndex.set(index);
      
      // Load new floor's canvas state
      this.loadFloorState(index);
      
      // Update canvas rendering
      if (this.viewMode() === '2d') {
        setTimeout(() => {
          this.initializeCanvas();
        }, 0);
      }
      
      // Clear selection when switching floors
      this.selectedItem.set(null);
      
      console.log(`Switched to floor: ${this.floors()[index].name}`);
    }
  }

  // Save current floor's walls and rooms
  private saveCurrentFloorState(): void {
    const currentIndex = this.currentFloorIndex();
    const floors = this.floors();
    
    if (currentIndex >= 0 && currentIndex < floors.length) {
      const currentFloor = floors[currentIndex];
      const updatedFloor: Floor = {
        ...currentFloor,
        walls: [...currentFloor.walls],
        rooms: [...currentFloor.rooms]
      };
      
      // Generate thumbnail before saving
      this.generateFloorThumbnail(currentIndex).then(thumbnail => {
        if (thumbnail) {
          updatedFloor.thumbnail = thumbnail;
        }
        this.updateFloorData(currentIndex, updatedFloor);
      });
    }
  }

  // Load floor's walls and rooms into canvas
  private loadFloorState(index: number): void {
    const floors = this.floors();
    if (index >= 0 && index < floors.length) {
      const floor = floors[index];
      // Walls and rooms are now computed from floors signal
      // Just trigger re-render
      this.renderWalls();
      this.renderRooms();
    }
  }

  // Update floor data in floors array
  private updateFloorData(index: number, floorData: Floor): void {
    this.floors.update(floors => {
      const updated = [...floors];
      updated[index] = floorData;
      return updated;
    });
  }

  // Helper methods to update current floor's walls and rooms
  private updateCurrentFloorWalls(updateFn: (walls: Wall[]) => Wall[]): void {
    const currentIndex = this.currentFloorIndex();
    const floors = this.floors();
    
    if (currentIndex >= 0 && currentIndex < floors.length) {
      const currentFloor = floors[currentIndex];
      const updatedFloor: Floor = {
        ...currentFloor,
        walls: updateFn([...currentFloor.walls])
      };
      this.updateFloorData(currentIndex, updatedFloor);
      
      // Regenerate thumbnail after a delay
      setTimeout(() => {
        this.generateFloorThumbnail(currentIndex).then(thumbnail => {
          if (thumbnail) {
            const floor = this.floors()[currentIndex];
            if (floor) {
              this.updateFloorData(currentIndex, { ...floor, thumbnail });
            }
          }
        });
      }, 300);
    }
  }

  private updateCurrentFloorRooms(updateFn: (rooms: Room[]) => Room[]): void {
    const currentIndex = this.currentFloorIndex();
    const floors = this.floors();
    
    if (currentIndex >= 0 && currentIndex < floors.length) {
      const currentFloor = floors[currentIndex];
      const updatedFloor: Floor = {
        ...currentFloor,
        rooms: updateFn([...currentFloor.rooms])
      };
      this.updateFloorData(currentIndex, updatedFloor);
      
      // Regenerate thumbnail after a delay
      setTimeout(() => {
        this.generateFloorThumbnail(currentIndex).then(thumbnail => {
          if (thumbnail) {
            const floor = this.floors()[currentIndex];
            if (floor) {
              this.updateFloorData(currentIndex, { ...floor, thumbnail });
            }
          }
        });
      }, 300);
    }
  }

  // Generate thumbnail for floor preview
  private async generateFloorThumbnail(floorIndex: number): Promise<string | null> {
    if (!isPlatformBrowser(this.platformId) || this.viewMode() !== '2d') {
      return null;
    }

    const floor = this.floors()[floorIndex];
    if (!floor || (!floor.walls.length && !floor.rooms.length)) {
      return null;
    }

    try {
      // Create a temporary canvas to render the floor plan
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;

      // Clear canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate bounds of all walls and rooms
      const allPoints: Point[] = [];
      floor.walls.forEach(wall => {
        allPoints.push(wall.start, wall.end);
      });
      floor.rooms.forEach(room => {
        allPoints.push(...room.points);
      });

      if (allPoints.length === 0) return null;

      const minX = Math.min(...allPoints.map(p => p.x));
      const maxX = Math.max(...allPoints.map(p => p.x));
      const minY = Math.min(...allPoints.map(p => p.y));
      const maxY = Math.max(...allPoints.map(p => p.y));

      const width = maxX - minX || 1000;
      const height = maxY - minY || 1000;
      const scale = Math.min(canvas.width / width, canvas.height / height) * 0.9;
      const offsetX = (canvas.width - width * scale) / 2 - minX * scale;
      const offsetY = (canvas.height - height * scale) / 2 - minY * scale;

      // Draw rooms
      floor.rooms.forEach(room => {
        if (room.points.length < 3) return;
        
        ctx.beginPath();
        ctx.moveTo(room.points[0].x * scale + offsetX, room.points[0].y * scale + offsetY);
        for (let i = 1; i < room.points.length; i++) {
          ctx.lineTo(room.points[i].x * scale + offsetX, room.points[i].y * scale + offsetY);
        }
        ctx.closePath();
        
        const color = this.getRoomColor(room.roomType || 'other');
        ctx.fillStyle = color + '40'; // Add transparency
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw walls
      ctx.strokeStyle = '#0A1A2F';
      ctx.lineWidth = 2;
      floor.walls.forEach(wall => {
        ctx.beginPath();
        ctx.moveTo(wall.start.x * scale + offsetX, wall.start.y * scale + offsetY);
        ctx.lineTo(wall.end.x * scale + offsetX, wall.end.y * scale + offsetY);
        ctx.stroke();
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.warn('Error generating floor thumbnail:', error);
      return null;
    }
  }

  deleteFloor(index: number, event: Event): void {
    event.stopPropagation(); // Prevent triggering switchFloor
    
    const floors = this.floors();
    if (floors.length <= 1) {
      // Cannot delete the last floor
      return;
    }

    if (index < 0 || index >= floors.length) {
      return;
    }

    this.addToUndoStack();

    // If deleting the current floor, switch to another floor first
    if (this.currentFloorIndex() === index) {
      // Switch to the previous floor, or next if deleting the first
      const newIndex = index > 0 ? index - 1 : 0;
      this.currentFloorIndex.set(newIndex);
    } else if (this.currentFloorIndex() > index) {
      // Adjust current floor index if we're deleting a floor before it
      this.currentFloorIndex.update(current => current - 1);
    }

    // Remove the floor
    this.floors.update(floors => floors.filter((_, i) => i !== index));

    // Re-index remaining floors
    this.floors.update(floors => 
      floors.map((floor, i) => ({ ...floor, index: i }))
    );
  }

  // Inspector Panel
  toggleInspector(): void {
    this.inspectorCollapsed.update(value => !value);
  }

  deleteSelected(): void {
    this.deleteSelectedItem();
  }

  updateSelectedItem(property: keyof SelectedItem, value: any): void {
    const current = this.selectedItem();
    if (current) {
      this.selectedItem.set({ ...current, [property]: value });
    }
  }

  // Catalog Panel
  toggleCatalog(): void {
    this.catalogCollapsed.update(value => !value);
  }

  onDragStart(event: DragEvent, item: CatalogItem): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(item));
      event.dataTransfer.effectAllowed = 'copy';
      console.log('Dragging item:', item);
    }
  }

  // Zoom Controls
  zoomIn(): void {
    this.zoomLevel.update(level => Math.min(level * 1.2, 5));
  }

  zoomOut(): void {
    this.zoomLevel.update(level => Math.max(level / 1.2, 0.1));
  }

  resetZoom(): void {
    this.zoomLevel.set(1);
  }

  // Undo/Redo
  undo(): void {
    if (this.canUndo()) {
      const state = this.undoStack().pop();
      if (state) {
        this.redoStack.update(stack => [...stack, this.getCurrentState()]);
        this.applyState(state);
        this.undoStack.update(stack => stack);
      }
    }
  }

  redo(): void {
    if (this.canRedo()) {
      const state = this.redoStack().pop();
      if (state) {
        this.undoStack.update(stack => [...stack, this.getCurrentState()]);
        this.applyState(state);
        this.redoStack.update(stack => stack);
      }
    }
  }

  private getCurrentState(): any {
    return {
      floors: this.floors(),
      currentFloorIndex: this.currentFloorIndex(),
      selectedItem: this.selectedItem(),
      zoomLevel: this.zoomLevel()
    };
  }

  private applyState(state: any): void {
    // Apply state (simplified for now)
    console.log('Applying state:', state);
  }

  private addToUndoStack(): void {
    const currentState = this.getCurrentState();
    this.undoStack.update(stack => [...stack, currentState]);
    // Clear redo stack on new action
    this.redoStack.set([]);
  }

  // ============================================
  // 2D DRAWING ENGINE METHODS
  // ============================================

  initializeCanvas(): void {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (!this.canvasSvg?.nativeElement || this.viewMode() !== '2d') return;
    
    const svg = this.canvasSvg.nativeElement;
    
    // Check if canvasContainer ViewChild is available
    if (!this.canvasContainer) {
      // Retry after a short delay if ViewChild isn't ready
      if (typeof setTimeout !== 'undefined') {
        setTimeout(() => this.initializeCanvas(), 100);
      }
      return;
    }
    
    const container = this.canvasContainer.nativeElement;
    
    // Verify container is a valid HTML element
    if (!container || typeof container.getBoundingClientRect !== 'function') {
      // Retry after a short delay if container isn't ready
      if (typeof setTimeout !== 'undefined') {
        setTimeout(() => this.initializeCanvas(), 100);
      }
      return;
    }

    try {
      const rect = container.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) {
        // Container not yet sized, retry
        if (typeof setTimeout !== 'undefined') {
          setTimeout(() => this.initializeCanvas(), 100);
        }
        return;
      }

      svg.setAttribute('width', rect.width.toString());
      svg.setAttribute('height', rect.height.toString());
      svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);

      this.updateGrid();
      this.renderWalls();
      this.renderRooms();
    } catch (error) {
      console.warn('Error initializing canvas:', error);
      // Retry after a delay
      if (typeof setTimeout !== 'undefined') {
        setTimeout(() => this.initializeCanvas(), 100);
      }
    }
  }

  updateGrid(): void {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (!this.canvasSvg?.nativeElement || !this.showGrid() || this.viewMode() !== '2d') return;
    
    const svg = this.canvasSvg.nativeElement;
    const gridSizePx = this.gridSize(); // Grid size in pixels (1cm = 1px for now)
    
    // Remove existing grid
    const existingGrid = svg.querySelector('#grid-pattern');
    if (existingGrid) {
      existingGrid.remove();
    }
    const existingBg = svg.querySelector('#grid-background');
    if (existingBg) {
      existingBg.remove();
    }

    // Create grid pattern
    let defs = svg.querySelector('defs');
    if (!defs && typeof document !== 'undefined') {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    if (typeof document === 'undefined' || !defs) return;
    
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', 'grid-pattern');
    pattern.setAttribute('width', gridSizePx.toString());
    pattern.setAttribute('height', gridSizePx.toString());
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', '0');
    line.setAttribute('x2', '0');
    line.setAttribute('y2', gridSizePx.toString());
    line.setAttribute('stroke', '#E5E7EB');
    line.setAttribute('stroke-width', '1');

    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '0');
    line2.setAttribute('y1', '0');
    line2.setAttribute('x2', gridSizePx.toString());
    line2.setAttribute('y2', '0');
    line2.setAttribute('stroke', '#E5E7EB');
    line2.setAttribute('stroke-width', '1');

    pattern.appendChild(line);
    pattern.appendChild(line2);
    defs.appendChild(pattern);

    // Apply grid as background
    const gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    gridRect.setAttribute('id', 'grid-background');
    gridRect.setAttribute('width', '100%');
    gridRect.setAttribute('height', '100%');
    gridRect.setAttribute('fill', 'url(#grid-pattern)');
    svg.insertBefore(gridRect, svg.firstChild);
  }

  // Convert screen coordinates to canvas coordinates
  screenToCanvas(screenX: number, screenY: number): Point {
    if (!this.canvasSvg?.nativeElement) return { x: screenX, y: screenY };
    
    const svg = this.canvasSvg.nativeElement as SVGSVGElement;
    
    if (!this.canvasContainer) return { x: screenX, y: screenY };
    
    const container = this.canvasContainer.nativeElement;
    if (!container || typeof container.getBoundingClientRect !== 'function') {
      return { x: screenX, y: screenY };
    }

    try {
      const rect = container.getBoundingClientRect();
      const viewBox = svg.viewBox?.baseVal || { width: rect.width, height: rect.height };
      
      const x = ((screenX - rect.left) / rect.width) * viewBox.width;
      const y = ((screenY - rect.top) / rect.height) * viewBox.height;
      
      return { x, y };
    } catch (error) {
      console.warn('Error converting screen to canvas coordinates:', error);
      return { x: screenX, y: screenY };
    }
  }

  // Snap point to grid
  snapToGrid(point: Point): Point {
    if (!this.snapEnabled()) return point;
    
    const gridSize = this.gridSize();
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  }

  // Calculate distance between two points
  calculateDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Format measurement for display
  // Note: distance is stored in centimeters internally
  formatMeasurement(distance: number): string {
    if (this.measurementUnit() === 'metric') {
      // Convert cm to mm (1 cm = 10 mm)
      const distanceMm = distance * 10;
      if (distanceMm >= 1000) {
        // Show in meters if >= 1000mm (1m)
        return `${(distanceMm / 1000).toFixed(2)}m`;
      }
      // Show in millimeters
      return `${Math.round(distanceMm)}mm`;
    } else {
      // Imperial: feet and inches (unchanged)
      const inches = distance / 2.54;
      if (inches >= 12) {
        const feet = Math.floor(inches / 12);
        const remainingInches = Math.round(inches % 12);
        return `${feet}'${remainingInches}"`;
      }
      return `${Math.round(inches)}"`;
    }
  }

  // Format area for display (area is in cm²)
  formatArea(areaCm2: number): string {
    if (this.measurementUnit() === 'metric') {
      // Convert cm² to mm² (1 cm² = 100 mm²)
      const areaMm2 = areaCm2 * 100;
      if (areaMm2 >= 1000000) {
        // Show in m² if >= 1,000,000 mm² (1 m²)
        return `${(areaMm2 / 1000000).toFixed(2)} m²`;
      }
      // Show in mm² for smaller areas
      return `${Math.round(areaMm2)} mm²`;
    } else {
      // Imperial: feet and inches (unchanged)
      const areaFt2 = areaCm2 / 929.03; // Convert cm² to ft²
      if (areaFt2 >= 1) {
        return `${areaFt2.toFixed(2)} ft²`;
      }
      const areaIn2 = areaCm2 / 6.4516; // Convert cm² to in²
      return `${areaIn2.toFixed(0)} in²`;
    }
  }

  // Canvas mouse event handlers
  onCanvasMouseDown(event: MouseEvent): void {
    if (this.viewMode() !== '2d') return;
    
    const point = this.screenToCanvas(event.clientX, event.clientY);
    const snappedPoint = this.snapToGrid(point);

    if (this.activeTool() === 'wall') {
      this.isDrawing.set(true);
      this.currentWallStart.set(snappedPoint);
      this.currentWallEnd.set(snappedPoint);
    } else if (this.activeTool() === 'select') {
      // Handle selection logic
      this.handleSelection(snappedPoint);
    }
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (this.viewMode() !== '2d') return;
    
    const point = this.screenToCanvas(event.clientX, event.clientY);
    const snappedPoint = this.snapToGrid(point);

    if (this.activeTool() === 'wall' && this.isDrawing()) {
      this.currentWallEnd.set(snappedPoint);
      this.renderWalls();
    }
  }

  onCanvasMouseUp(event: MouseEvent): void {
    if (this.viewMode() !== '2d') return;
    
    if (this.activeTool() === 'wall' && this.isDrawing()) {
      const start = this.currentWallStart();
      const end = this.currentWallEnd();
      
      if (start && end && (start.x !== end.x || start.y !== end.y)) {
        const length = this.calculateDistance(start, end);
        const newWall: Wall = {
          id: `wall-${Date.now()}`,
          start,
          end,
          length,
          thickness: 10 // Default 10cm wall thickness
        };
        
        this.addToUndoStack();
        this.updateCurrentFloorWalls(walls => [...walls, newWall]);
        
        // Check for closed polygons (rooms)
        this.detectRooms();
      }
      
      this.isDrawing.set(false);
      this.currentWallStart.set(null);
      this.currentWallEnd.set(null);
      this.renderWalls();
    }
  }

  onCanvasMouseLeave(): void {
    if (this.isDrawing()) {
      this.isDrawing.set(false);
      this.currentWallStart.set(null);
      this.currentWallEnd.set(null);
      this.renderWalls();
    }
  }

  // Render walls on canvas
  renderWalls(): void {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (!this.canvasSvg?.nativeElement) return;
    
    const svg = this.canvasSvg.nativeElement;
    
    // Remove existing wall elements
    const existingWalls = svg.querySelectorAll('.wall-line, .wall-measurement, .wall-preview');
    existingWalls.forEach(el => el.remove());

    // Render all walls
    this.walls().forEach(wall => {
      this.renderWall(wall);
    });

    // Render preview wall if drawing
    if (this.isDrawing() && this.currentWallStart() && this.currentWallEnd()) {
      const previewWall: Wall = {
        id: 'preview',
        start: this.currentWallStart()!,
        end: this.currentWallEnd()!,
        length: this.calculateDistance(this.currentWallStart()!, this.currentWallEnd()!)
      };
      this.renderWall(previewWall, true);
    }
  }

  renderWall(wall: Wall, isPreview: boolean = false): void {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (!this.canvasSvg?.nativeElement || typeof document === 'undefined') return;
    
    const svg = this.canvasSvg.nativeElement;
    const className = isPreview ? 'wall-preview' : 'wall-line';
    
    // Draw wall line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', className);
    line.setAttribute('x1', wall.start.x.toString());
    line.setAttribute('y1', wall.start.y.toString());
    line.setAttribute('x2', wall.end.x.toString());
    line.setAttribute('y2', wall.end.y.toString());
    line.setAttribute('stroke', isPreview ? '#2E86FF' : '#0A1A2F');
    line.setAttribute('stroke-width', (wall.thickness || 10).toString());
    line.setAttribute('stroke-linecap', 'round');
    if (isPreview) {
      line.setAttribute('stroke-dasharray', '5,5');
      line.setAttribute('opacity', '0.7');
    }
    line.style.cursor = 'pointer';
    line.addEventListener('click', () => {
      if (!isPreview) {
        this.selectWall(wall.id);
      }
    });
    svg.appendChild(line);

    // Draw measurement label
    if (!isPreview) {
      const midX = (wall.start.x + wall.end.x) / 2;
      const midY = (wall.start.y + wall.end.y) / 2;
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'wall-measurement');
      text.setAttribute('x', midX.toString());
      text.setAttribute('y', (midY - 5).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#2E86FF');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', '500');
      text.setAttribute('pointer-events', 'none');
      text.textContent = this.formatMeasurement(wall.length);
      
      // Add background rectangle for better visibility
      const bbox = text.getBBox();
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', (bbox.x - 4).toString());
      rect.setAttribute('y', (bbox.y - 2).toString());
      rect.setAttribute('width', (bbox.width + 8).toString());
      rect.setAttribute('height', (bbox.height + 4).toString());
      rect.setAttribute('fill', 'white');
      rect.setAttribute('opacity', '0.9');
      rect.setAttribute('rx', '4');
      
      svg.appendChild(rect);
      svg.appendChild(text);
    }
  }

  // Select a wall
  selectWall(wallId: string): void {
    const wall = this.walls().find(w => w.id === wallId);
    if (wall) {
      this.selectedItem.set({
        type: 'wall',
        id: wall.id,
        length: wall.length,
        layer: 'walls'
      });
    }
  }

  // Handle selection at a point
  handleSelection(point: Point): void {
    // Check if clicking on a wall
    const clickedWall = this.walls().find(wall => {
      const dist = this.distanceToLineSegment(point, wall.start, wall.end);
      return dist < 20; // 20px threshold
    });

    if (clickedWall) {
      this.selectWall(clickedWall.id);
    } else {
      // Check if clicking on a room
      const clickedRoom = this.rooms().find(room => {
        return this.isPointInPolygon(point, room.points);
      });

      if (clickedRoom) {
        this.selectedItem.set({
          type: 'room',
          id: clickedRoom.id,
          roomType: clickedRoom.roomType,
          layer: 'rooms'
        });
      } else {
        this.selectedItem.set(null);
      }
    }
  }

  // Calculate distance from point to line segment
  distanceToLineSegment(point: Point, lineStart: Point, lineEnd: Point): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Detect closed polygons (rooms) from walls
  detectRooms(): void {
    const walls = this.walls();
    if (walls.length < 3) {
      this.updateCurrentFloorRooms(() => []);
      this.renderRooms();
      return;
    }

    // Build graph of connected walls with tolerance for point matching
    const tolerance = this.gridSize() / 2;
    const connections = new Map<string, Point[]>();
    
    const getKey = (p: Point): string => {
      // Round to nearest grid point
      const x = Math.round(p.x / this.gridSize()) * this.gridSize();
      const y = Math.round(p.y / this.gridSize()) * this.gridSize();
      return `${x},${y}`;
    };

    const normalizePoint = (p: Point): Point => {
      const x = Math.round(p.x / this.gridSize()) * this.gridSize();
      const y = Math.round(p.y / this.gridSize()) * this.gridSize();
      return { x, y };
    };
    
    walls.forEach(wall => {
      const start = normalizePoint(wall.start);
      const end = normalizePoint(wall.end);
      const startKey = getKey(start);
      const endKey = getKey(end);
      
      if (startKey === endKey) return; // Skip zero-length walls
      
      if (!connections.has(startKey)) {
        connections.set(startKey, []);
      }
      if (!connections.has(endKey)) {
        connections.set(endKey, []);
      }
      
      // Add connections (avoid duplicates)
      if (!connections.get(startKey)!.some(p => getKey(p) === endKey)) {
        connections.get(startKey)!.push(end);
      }
      if (!connections.get(endKey)!.some(p => getKey(p) === startKey)) {
        connections.get(endKey)!.push(start);
      }
    });

    // Find closed loops (rooms)
    const visited = new Set<string>();
    const rooms: Room[] = [];
    const processedLoops = new Set<string>();

    connections.forEach((neighbors, pointKey) => {
      if (visited.has(pointKey) || neighbors.length < 2) return;
      
      const [x, y] = pointKey.split(',').map(Number);
      const startPoint: Point = { x, y };
      
      // Try to find a closed loop starting from this point
      const loop = this.findClosedLoop(startPoint, connections, visited, tolerance);
      
      if (loop && loop.length >= 3) {
        // Create a unique key for this loop to avoid duplicates
        const loopKey = loop.map(p => getKey(p)).sort().join('|');
        if (processedLoops.has(loopKey)) return;
        processedLoops.add(loopKey);
        
        // Calculate area using shoelace formula
        const area = this.calculatePolygonArea(loop);
        
        // Only create room if area is significant (at least 1 square meter)
        if (area > 10000) { // 10000 cm² = 1 m²
          // Calculate center
          const center = this.calculatePolygonCenter(loop);
          
          // Check if this room already exists (preserve room type)
          const existingRoom = this.rooms().find(r => {
            if (r.points.length !== loop.length) return false;
            const rKey = r.points.map(p => getKey(p)).sort().join('|');
            return rKey === loopKey;
          });
          
          const room: Room = {
            id: existingRoom?.id || `room-${Date.now()}-${rooms.length}`,
            points: loop,
            area,
            center,
            roomType: existingRoom?.roomType
          };
          
          rooms.push(room);
        }
      }
    });

    this.updateCurrentFloorRooms(() => rooms);
    this.renderRooms();
  }

  // Find closed loop starting from a point
  findClosedLoop(startPoint: Point, connections: Map<string, Point[]>, visited: Set<string>, tolerance: number): Point[] | null {
    const getKey = (p: Point): string => {
      const x = Math.round(p.x / this.gridSize()) * this.gridSize();
      const y = Math.round(p.y / this.gridSize()) * this.gridSize();
      return `${x},${y}`;
    };

    const isSamePoint = (p1: Point, p2: Point): boolean => {
      return getKey(p1) === getKey(p2);
    };

    const startKey = getKey(startPoint);
    const visitedInLoop = new Set<string>();
    const path: Point[] = [startPoint];
    const maxDepth = 15; // Prevent infinite loops
    
    const dfs = (current: Point, target: Point, depth: number): boolean => {
      if (depth > maxDepth) return false;
      
      const currentKey = getKey(current);
      
      // Check if we've completed a loop (at least 3 points and back to start)
      if (depth >= 3 && isSamePoint(current, target)) {
        return true;
      }

      // Don't revisit points in this path (except the target)
      if (visitedInLoop.has(currentKey) && depth > 1) {
        return false;
      }

      visitedInLoop.add(currentKey);
      const neighbors = connections.get(currentKey) || [];

      // Sort neighbors by distance to target to prefer shorter paths
      const sortedNeighbors = [...neighbors].sort((a, b) => {
        const distA = this.calculateDistance(a, target);
        const distB = this.calculateDistance(b, target);
        return distA - distB;
      });

      for (const neighbor of sortedNeighbors) {
        const neighborKey = getKey(neighbor);
        
        // Allow returning to target if we have enough points
        if (depth >= 2 && isSamePoint(neighbor, target)) {
          path.push(neighbor);
          return true;
        }
        
        // Continue exploring if not visited in this path
        if (!visitedInLoop.has(neighborKey)) {
          path.push(neighbor);
          if (dfs(neighbor, target, depth + 1)) {
            return true;
          }
          path.pop();
        }
      }

      visitedInLoop.delete(currentKey);
      return false;
    };

    if (dfs(startPoint, startPoint, 0) && path.length >= 3) {
      // Remove duplicate consecutive points
      const cleanedPath: Point[] = [path[0]];
      for (let i = 1; i < path.length; i++) {
        if (!isSamePoint(path[i], cleanedPath[cleanedPath.length - 1])) {
          cleanedPath.push(path[i]);
        }
      }
      
      // Ensure the path is closed
      if (cleanedPath.length >= 3 && !isSamePoint(cleanedPath[0], cleanedPath[cleanedPath.length - 1])) {
        cleanedPath.push(cleanedPath[0]);
      }
      
      if (cleanedPath.length >= 4) { // At least 3 unique points + closing point
        // Mark all points in the loop as visited
        cleanedPath.forEach(p => visited.add(getKey(p)));
        return cleanedPath;
      }
    }

    return null;
  }

  // Calculate polygon area using shoelace formula
  calculatePolygonArea(points: Point[]): number {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  // Calculate polygon center
  calculatePolygonCenter(points: Point[]): Point {
    const sum = points.reduce((acc, p) => ({
      x: acc.x + p.x,
      y: acc.y + p.y
    }), { x: 0, y: 0 });
    
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  // Check if point is inside polygon
  isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Render rooms on canvas
  renderRooms(): void {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (!this.canvasSvg?.nativeElement) return;
    
    const svg = this.canvasSvg.nativeElement;
    
    // Remove existing room elements
    const existingRooms = svg.querySelectorAll('.room-polygon, .room-label, .room-area');
    existingRooms.forEach(el => el.remove());

    // Render all rooms
    this.rooms().forEach(room => {
      this.renderRoom(room);
    });
  }

  renderRoom(room: Room): void {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (!this.canvasSvg?.nativeElement || room.points.length < 3 || typeof document === 'undefined') return;
    
    const svg = this.canvasSvg.nativeElement;
    
    // Create polygon
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const pointsStr = room.points.map(p => `${p.x},${p.y}`).join(' ');
    polygon.setAttribute('class', 'room-polygon');
    polygon.setAttribute('points', pointsStr);
    polygon.setAttribute('fill', this.getRoomColor(room.roomType || 'other'));
    polygon.setAttribute('fill-opacity', '0.2');
    polygon.setAttribute('stroke', this.getRoomColor(room.roomType || 'other'));
    polygon.setAttribute('stroke-width', '2');
    polygon.setAttribute('stroke-dasharray', '5,5');
    polygon.style.cursor = 'pointer';
    polygon.addEventListener('click', () => {
      this.selectedItem.set({
        type: 'room',
        id: room.id,
        roomType: room.roomType,
        layer: 'rooms'
      });
    });
    svg.appendChild(polygon);

    // Add room label
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'room-label');
    text.setAttribute('x', room.center.x.toString());
    text.setAttribute('y', room.center.y.toString());
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#0A1A2F');
    text.setAttribute('font-size', '14');
    text.setAttribute('font-weight', '600');
    text.setAttribute('pointer-events', 'none');
    
    const roomTypeLabel = this.roomTypes.find(rt => rt.value === room.roomType)?.label || 'Room';
    text.textContent = roomTypeLabel;
    svg.appendChild(text);

    // Add area label
    const areaText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    areaText.setAttribute('class', 'room-area');
    areaText.setAttribute('x', room.center.x.toString());
    areaText.setAttribute('y', (room.center.y + 18).toString());
    areaText.setAttribute('text-anchor', 'middle');
    areaText.setAttribute('dominant-baseline', 'middle');
    areaText.setAttribute('fill', '#6B7280');
    areaText.setAttribute('font-size', '11');
    areaText.setAttribute('pointer-events', 'none');
    // Room area is already in cm², use formatArea for consistent formatting
    areaText.textContent = this.formatArea(room.area);
    svg.appendChild(areaText);
  }

  // Get color for room type
  getRoomColor(roomType: string): string {
    const colors: { [key: string]: string } = {
      bedroom: '#8B5CF6',
      kitchen: '#F59E0B',
      living: '#10B981',
      bathroom: '#06B6D4',
      office: '#6366F1',
      meeting: '#EC4899',
      server: '#EF4444',
      mandir: '#F97316',
      dining: '#14B8A6',
      hallway: '#94A3B8',
      storage: '#64748B',
      other: '#A855F7'
    };
    return colors[roomType] || colors['other'];
  }

  // Update room type
  updateRoomType(roomId: string, roomType: string): void {
    this.addToUndoStack();
    this.updateCurrentFloorRooms(rooms => 
      rooms.map(room => 
        room.id === roomId ? { ...room, roomType } : room
      )
    );
    this.renderRooms();
    
    // Update selected item if it's the same room
    const selected = this.selectedItem();
    if (selected && selected.id === roomId) {
      this.selectedItem.set({ ...selected, roomType });
    }
  }

  // Delete selected item
  deleteSelectedItem(): void {
    const selected = this.selectedItem();
    if (!selected) return;

    this.addToUndoStack();

    if (selected.type === 'wall' && selected.id) {
      this.updateCurrentFloorWalls(walls => walls.filter(w => w.id !== selected.id));
      this.detectRooms(); // Re-detect rooms after wall deletion
    } else if (selected.type === 'room' && selected.id) {
      this.updateCurrentFloorRooms(rooms => rooms.filter(r => r.id !== selected.id));
    }

    this.selectedItem.set(null);
    this.renderWalls();
    this.renderRooms();
  }
}
