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
  doors: Door[];
  windows: Window[];
  columns: Column[];
  staircases: Staircase[];
  components: PlacedComponent[]; // For catalog items
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

interface Door {
  id: string;
  position: Point;
  rotation: number;
  width: number;
  height: number;
  wallId?: string; // Reference to wall it's placed on
}

interface Window {
  id: string;
  position: Point;
  rotation: number;
  width: number;
  height: number;
  wallId?: string; // Reference to wall it's placed on
}

interface Column {
  id: string;
  position: Point;
  diameter: number;
  height: number;
}

interface Staircase {
  id: string;
  position: Point;
  rotation: number;
  width: number;
  length: number;
  direction: 'up' | 'down';
}

interface PlacedComponent {
  id: string;
  type: string;
  position: Point;
  rotation: number;
  width: number;
  height: number;
  depth?: number;
  catalogItemId?: string; // Reference to catalog item
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
    { 
      id: '1', 
      name: 'Ground Floor', 
      index: 0, 
      walls: [], 
      rooms: [],
      doors: [],
      windows: [],
      columns: [],
      staircases: [],
      components: []
    }
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
  
  // Computed: Format zoom level as percentage
  zoomPercentage = computed(() => {
    return Math.round(this.zoomLevel() * 100) + '%';
  });

  // 2D Drawing State - computed from current floor
  walls = computed(() => {
    const floor = this.floors()[this.currentFloorIndex()];
    return floor ? floor.walls : [];
  });
  
  rooms = computed(() => {
    const floor = this.floors()[this.currentFloorIndex()];
    return floor ? floor.rooms : [];
  });

  doors = computed(() => {
    const floor = this.floors()[this.currentFloorIndex()];
    return floor ? floor.doors : [];
  });

  windows = computed(() => {
    const floor = this.floors()[this.currentFloorIndex()];
    return floor ? floor.windows : [];
  });

  columns = computed(() => {
    const floor = this.floors()[this.currentFloorIndex()];
    return floor ? floor.columns : [];
  });

  staircases = computed(() => {
    const floor = this.floors()[this.currentFloorIndex()];
    return floor ? floor.staircases : [];
  });

  components = computed(() => {
    const floor = this.floors()[this.currentFloorIndex()];
    return floor ? floor.components : [];
  });

  isDrawing = signal<boolean>(false);
  currentWallStart = signal<Point | null>(null);
  currentWallEnd = signal<Point | null>(null);
  isPlacingComponent = signal<boolean>(false);
  componentToPlace = signal<PlacedComponent | null>(null);
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

      // Effect to re-render walls when they change
      effect(() => {
        if (this.viewMode() === '2d') {
          const walls = this.walls();
          // Use setTimeout to ensure DOM is ready
          setTimeout(() => {
            this.renderWalls();
          }, 0);
        }
      });

      // Effect to re-render rooms when they change
      effect(() => {
        if (this.viewMode() === '2d') {
          const rooms = this.rooms();
          // Use setTimeout to ensure DOM is ready
          setTimeout(() => {
            this.renderRooms();
          }, 0);
        }
      });

      // Effect to re-render doors, windows, columns, staircases, and components
      effect(() => {
        if (this.viewMode() === '2d') {
          setTimeout(() => {
            this.renderDoors();
            this.renderWindows();
            this.renderColumns();
            this.renderStaircases();
            this.renderComponents();
          }, 0);
        }
      });

      // Effect to re-initialize canvas when view mode changes to 2D
      effect(() => {
        if (this.viewMode() === '2d') {
          setTimeout(() => {
            this.initializeCanvas();
          }, 100);
        }
      });

      // Effect to apply zoom when zoom level changes (only if canvas is initialized)
      effect(() => {
        const zoom = this.zoomLevel();
        const viewMode = this.viewMode();
        if (viewMode === '2d' && zoom !== undefined && this.canvasSvg?.nativeElement) {
          // Use a small delay to avoid infinite loops
          setTimeout(() => {
            if (this.viewMode() === '2d') {
              this.applyZoom();
            }
          }, 10);
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
    console.log('setViewMode called with mode:', mode, 'current mode:', this.viewMode());
    this.viewMode.set(mode);
    console.log('viewMode updated to:', this.viewMode());
    // When switching to 3D, we'll need to convert 2D geometry
    if (mode === '3d') {
      console.log('Switching to 3D mode - geometry conversion will happen here');
    } else if (mode === '2d') {
      // Reinitialize canvas when switching back to 2D
      // Use a longer timeout to ensure @if block has rendered
      setTimeout(() => {
        this.initializeCanvas();
      }, 150);
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
    console.log('toggleSnap called, current value:', this.snapEnabled());
    this.snapEnabled.update(value => !value);
    console.log('toggleSnap new value:', this.snapEnabled());
  }

  toggleGrid(): void {
    console.log('toggleGrid called, current value:', this.showGrid());
    this.showGrid.update(value => !value);
    console.log('toggleGrid new value:', this.showGrid());
    this.updateGrid();
  }

  // Floor Management
  addFloor(): void {
    const newFloor: Floor = {
      id: `${Date.now()}`,
      name: `Floor ${this.floors().length + 1}`,
      index: this.floors().length,
      walls: [],
      rooms: [],
      doors: [],
      windows: [],
      columns: [],
      staircases: [],
      components: []
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
        rooms: [...currentFloor.rooms],
        doors: [...currentFloor.doors],
        windows: [...currentFloor.windows],
        columns: [...currentFloor.columns],
        staircases: [...currentFloor.staircases],
        components: [...currentFloor.components]
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
      
      // Update the actual component in the floor data
      if (current.id) {
        if (current.type === 'door') {
          this.updateCurrentFloorDoors(doors =>
            doors.map(door =>
              door.id === current.id ? { ...door, [property]: value } : door
            )
          );
          this.renderDoors();
        } else if (current.type === 'window') {
          this.updateCurrentFloorWindows(windows =>
            windows.map(window =>
              window.id === current.id ? { ...window, [property]: value } : window
            )
          );
          this.renderWindows();
        } else if (current.type === 'column') {
          this.updateCurrentFloorColumns(columns =>
            columns.map(column =>
              column.id === current.id ? { ...column, [property]: value } : column
            )
          );
          this.renderColumns();
        } else if (current.type === 'staircase') {
          this.updateCurrentFloorStaircases(staircases =>
            staircases.map(staircase =>
              staircase.id === current.id ? { ...staircase, [property]: value } : staircase
            )
          );
          this.renderStaircases();
        } else if (current.type === 'component') {
          this.updateComponentProperty(current.id, property as keyof PlacedComponent, value);
        }
      }
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
      // Set a visual indicator
      if (event.dataTransfer.setDragImage && event.target) {
        const dragImage = document.createElement('div');
        dragImage.textContent = item.name;
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        event.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => document.body.removeChild(dragImage), 0);
      }
    }
  }

  onCanvasDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    // Add visual feedback
    if (this.canvasSvg?.nativeElement) {
      this.canvasSvg.nativeElement.classList.add('drag-over');
    }
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Remove visual feedback
    if (this.canvasSvg?.nativeElement) {
      this.canvasSvg.nativeElement.classList.remove('drag-over');
    }
    
    if (!event.dataTransfer) return;
    
    try {
      const data = event.dataTransfer.getData('application/json');
      if (data) {
        const catalogItem: CatalogItem = JSON.parse(data);
        const point = this.screenToCanvas(event.clientX, event.clientY);
        const snappedPoint = this.snapToGrid(point);
        this.placeComponent(snappedPoint, catalogItem);
      }
    } catch (error) {
      console.warn('Error handling drop:', error);
    }
  }

  onCanvasDragLeave(event: DragEvent): void {
    // Remove visual feedback when leaving canvas
    if (this.canvasSvg?.nativeElement) {
      this.canvasSvg.nativeElement.classList.remove('drag-over');
    }
  }

  // Zoom Controls
  zoomIn(): void {
    console.log('zoomIn called, current zoom:', this.zoomLevel());
    const newZoom = Math.min(this.zoomLevel() * 1.2, 5);
    this.zoomLevel.set(newZoom);
    console.log('zoomIn new zoom:', this.zoomLevel());
    this.applyZoom();
  }

  zoomOut(): void {
    console.log('zoomOut called, current zoom:', this.zoomLevel());
    const newZoom = Math.max(this.zoomLevel() / 1.2, 0.1);
    this.zoomLevel.set(newZoom);
    console.log('zoomOut new zoom:', this.zoomLevel());
    this.applyZoom();
  }

  resetZoom(): void {
    console.log('resetZoom called');
    this.zoomLevel.set(1);
    this.applyZoom();
  }

  applyZoom(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvasSvg?.nativeElement || this.viewMode() !== '2d') return;
    if (!this.canvasContainer?.nativeElement) return;

    const svg = this.canvasSvg.nativeElement;
    const container = this.canvasContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const zoom = this.zoomLevel();
    const baseWidth = rect.width;
    const baseHeight = rect.height;
    
    // Adjust viewBox based on zoom level
    // When zoom > 1, we show less of the canvas (zoom in)
    // When zoom < 1, we show more of the canvas (zoom out)
    const viewBoxWidth = baseWidth / zoom;
    const viewBoxHeight = baseHeight / zoom;
    
    // Center the viewBox
    const viewBoxX = (baseWidth - viewBoxWidth) / 2;
    const viewBoxY = (baseHeight - viewBoxHeight) / 2;
    
    svg.setAttribute('width', baseWidth.toString());
    svg.setAttribute('height', baseHeight.toString());
    svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
    
    // Re-render everything with new zoom
    this.updateGrid();
    this.renderWalls();
    this.renderRooms();
    this.renderDoors();
    this.renderWindows();
    this.renderColumns();
    this.renderStaircases();
    this.renderComponents();
  }

  // Undo/Redo
  undo(): void {
    console.log('undo called, canUndo:', this.canUndo(), 'undoStack length:', this.undoStack().length);
    if (this.canUndo()) {
      const stack = [...this.undoStack()];
      const state = stack.pop();
      if (state) {
        this.redoStack.update(redoStack => [...redoStack, this.getCurrentState()]);
        this.applyState(state);
        this.undoStack.set(stack);
        console.log('undo applied, new undoStack length:', this.undoStack().length);
      }
    }
  }

  redo(): void {
    console.log('redo called, canRedo:', this.canRedo(), 'redoStack length:', this.redoStack().length);
    if (this.canRedo()) {
      const stack = [...this.redoStack()];
      const state = stack.pop();
      if (state) {
        this.undoStack.update(undoStack => [...undoStack, this.getCurrentState()]);
        this.applyState(state);
        this.redoStack.set(stack);
        console.log('redo applied, new redoStack length:', this.redoStack().length);
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
    console.log('Applying state:', state);
    if (state) {
      if (state.floors) {
        this.floors.set(state.floors);
      }
      if (state.currentFloorIndex !== undefined) {
        this.currentFloorIndex.set(state.currentFloorIndex);
      }
      if (state.selectedItem !== undefined) {
        this.selectedItem.set(state.selectedItem);
      }
      if (state.zoomLevel !== undefined) {
        this.zoomLevel.set(state.zoomLevel);
      }
      // Re-render canvas after applying state
      if (this.viewMode() === '2d') {
        setTimeout(() => {
          this.initializeCanvas();
        }, 0);
      }
    }
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

      // Apply zoom when initializing
      const zoom = this.zoomLevel();
      const baseWidth = rect.width;
      const baseHeight = rect.height;
      const viewBoxWidth = baseWidth / zoom;
      const viewBoxHeight = baseHeight / zoom;
      const viewBoxX = (baseWidth - viewBoxWidth) / 2;
      const viewBoxY = (baseHeight - viewBoxHeight) / 2;
      
      svg.setAttribute('width', baseWidth.toString());
      svg.setAttribute('height', baseHeight.toString());
      svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);

      this.updateGrid();
      this.renderWalls();
      this.renderRooms();
      this.renderDoors();
      this.renderWindows();
      this.renderColumns();
      this.renderStaircases();
      this.renderComponents();
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
    
    if (!this.canvasSvg?.nativeElement || this.viewMode() !== '2d') return;
    
    const svg = this.canvasSvg.nativeElement;
    
    // Remove existing grid
    const existingGrid = svg.querySelector('#grid-pattern');
    if (existingGrid) {
      existingGrid.remove();
    }
    const existingBg = svg.querySelector('#grid-background');
    if (existingBg) {
      existingBg.remove();
    }
    
    // If grid is hidden, just remove it and return
    if (!this.showGrid()) {
      return;
    }
    
    const gridSizePx = this.gridSize(); // Grid size in pixels (1cm = 1px for now)

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
      const viewBox = svg.viewBox?.baseVal;
      
      if (!viewBox) {
        return { x: screenX - rect.left, y: screenY - rect.top };
      }
      
      // Account for viewBox offset and scale
      const x = viewBox.x + ((screenX - rect.left) / rect.width) * viewBox.width;
      const y = viewBox.y + ((screenY - rect.top) / rect.height) * viewBox.height;
      
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
    } else if (this.activeTool() === 'door') {
      this.placeDoor(snappedPoint);
    } else if (this.activeTool() === 'window') {
      this.placeWindow(snappedPoint);
    } else if (this.activeTool() === 'column') {
      this.placeColumn(snappedPoint);
    } else if (this.activeTool() === 'staircase') {
      this.placeStaircase(snappedPoint);
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
    } else if (this.isPlacingComponent() && this.componentToPlace()) {
      // Update preview position for drag and drop
      const component = this.componentToPlace()!;
      this.componentToPlace.set({
        ...component,
        position: snappedPoint
      });
      this.renderComponents();
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

  // Update component properties
  updateComponentProperty(componentId: string, property: keyof PlacedComponent, value: any): void {
    this.addToUndoStack();
    this.updateCurrentFloorComponents(components =>
      components.map(component =>
        component.id === componentId ? { ...component, [property]: value } : component
      )
    );
    this.renderComponents();
    
    // Update selected item if it's the same component
    const selected = this.selectedItem();
    if (selected && selected.id === componentId) {
      this.selectedItem.set({ ...selected, [property]: value });
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
    } else if (selected.type === 'door' && selected.id) {
      this.updateCurrentFloorDoors(doors => doors.filter(d => d.id !== selected.id));
    } else if (selected.type === 'window' && selected.id) {
      this.updateCurrentFloorWindows(windows => windows.filter(w => w.id !== selected.id));
    } else if (selected.type === 'column' && selected.id) {
      this.updateCurrentFloorColumns(columns => columns.filter(c => c.id !== selected.id));
    } else if (selected.type === 'staircase' && selected.id) {
      this.updateCurrentFloorStaircases(staircases => staircases.filter(s => s.id !== selected.id));
    } else if (selected.type === 'component' && selected.id) {
      this.updateCurrentFloorComponents(components => components.filter(c => c.id !== selected.id));
    }

    this.selectedItem.set(null);
    this.renderWalls();
    this.renderRooms();
    this.renderDoors();
    this.renderWindows();
    this.renderColumns();
    this.renderStaircases();
    this.renderComponents();
  }

  // ============================================
  // COMPONENT PLACEMENT METHODS
  // ============================================

  placeDoor(position: Point): void {
    const door: Door = {
      id: `door-${Date.now()}`,
      position,
      rotation: 0,
      width: 90, // 90cm standard door width
      height: 210 // 210cm standard door height
    };

    this.addToUndoStack();
    this.updateCurrentFloorDoors(doors => [...doors, door]);
    this.renderDoors();
  }

  placeWindow(position: Point): void {
    const window: Window = {
      id: `window-${Date.now()}`,
      position,
      rotation: 0,
      width: 120, // 120cm standard window width
      height: 120 // 120cm standard window height
    };

    this.addToUndoStack();
    this.updateCurrentFloorWindows(windows => [...windows, window]);
    this.renderWindows();
  }

  placeColumn(position: Point): void {
    const column: Column = {
      id: `column-${Date.now()}`,
      position,
      diameter: 30, // 30cm column diameter
      height: 300 // 300cm column height
    };

    this.addToUndoStack();
    this.updateCurrentFloorColumns(columns => [...columns, column]);
    this.renderColumns();
  }

  placeStaircase(position: Point): void {
    const staircase: Staircase = {
      id: `staircase-${Date.now()}`,
      position,
      rotation: 0,
      width: 100, // 100cm staircase width
      length: 300, // 300cm staircase length
      direction: 'up'
    };

    this.addToUndoStack();
    this.updateCurrentFloorStaircases(staircases => [...staircases, staircase]);
    this.renderStaircases();
  }

  placeComponent(position: Point, catalogItem?: CatalogItem): void {
    const component: PlacedComponent = {
      id: `component-${Date.now()}`,
      type: catalogItem?.category || 'furniture',
      position,
      rotation: 0,
      width: 60, // Default 60cm
      height: 60, // Default 60cm
      depth: 60, // Default 60cm
      catalogItemId: catalogItem?.id
    };

    this.addToUndoStack();
    this.updateCurrentFloorComponents(components => [...components, component]);
    this.renderComponents();
    this.isPlacingComponent.set(false);
    this.componentToPlace.set(null);
  }

  // ============================================
  // UPDATE FLOOR DATA METHODS
  // ============================================

  private updateCurrentFloorDoors(updateFn: (doors: Door[]) => Door[]): void {
    const currentIndex = this.currentFloorIndex();
    const floors = this.floors();
    
    if (currentIndex >= 0 && currentIndex < floors.length) {
      const currentFloor = floors[currentIndex];
      const updatedFloor: Floor = {
        ...currentFloor,
        doors: updateFn([...currentFloor.doors])
      };
      this.updateFloorData(currentIndex, updatedFloor);
    }
  }

  private updateCurrentFloorWindows(updateFn: (windows: Window[]) => Window[]): void {
    const currentIndex = this.currentFloorIndex();
    const floors = this.floors();
    
    if (currentIndex >= 0 && currentIndex < floors.length) {
      const currentFloor = floors[currentIndex];
      const updatedFloor: Floor = {
        ...currentFloor,
        windows: updateFn([...currentFloor.windows])
      };
      this.updateFloorData(currentIndex, updatedFloor);
    }
  }

  private updateCurrentFloorColumns(updateFn: (columns: Column[]) => Column[]): void {
    const currentIndex = this.currentFloorIndex();
    const floors = this.floors();
    
    if (currentIndex >= 0 && currentIndex < floors.length) {
      const currentFloor = floors[currentIndex];
      const updatedFloor: Floor = {
        ...currentFloor,
        columns: updateFn([...currentFloor.columns])
      };
      this.updateFloorData(currentIndex, updatedFloor);
    }
  }

  private updateCurrentFloorStaircases(updateFn: (staircases: Staircase[]) => Staircase[]): void {
    const currentIndex = this.currentFloorIndex();
    const floors = this.floors();
    
    if (currentIndex >= 0 && currentIndex < floors.length) {
      const currentFloor = floors[currentIndex];
      const updatedFloor: Floor = {
        ...currentFloor,
        staircases: updateFn([...currentFloor.staircases])
      };
      this.updateFloorData(currentIndex, updatedFloor);
    }
  }

  private updateCurrentFloorComponents(updateFn: (components: PlacedComponent[]) => PlacedComponent[]): void {
    const currentIndex = this.currentFloorIndex();
    const floors = this.floors();
    
    if (currentIndex >= 0 && currentIndex < floors.length) {
      const currentFloor = floors[currentIndex];
      const updatedFloor: Floor = {
        ...currentFloor,
        components: updateFn([...currentFloor.components])
      };
      this.updateFloorData(currentIndex, updatedFloor);
    }
  }

  // ============================================
  // RENDERING METHODS
  // ============================================

  renderDoors(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvasSvg?.nativeElement) return;
    
    const svg = this.canvasSvg.nativeElement;
    const existingDoors = svg.querySelectorAll('.door-element');
    existingDoors.forEach(el => el.remove());

    this.doors().forEach(door => {
      this.renderDoor(door);
    });
  }

  renderDoor(door: Door): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvasSvg?.nativeElement || typeof document === 'undefined') return;
    
    const svg = this.canvasSvg.nativeElement;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'door-element');
    group.setAttribute('data-door-id', door.id);
    
    // Draw door rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', (door.position.x - door.width / 2).toString());
    rect.setAttribute('y', (door.position.y - door.width / 2).toString());
    rect.setAttribute('width', door.width.toString());
    rect.setAttribute('height', door.width.toString());
    rect.setAttribute('fill', '#8B4513');
    rect.setAttribute('stroke', '#654321');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('rx', '2');
    rect.style.cursor = 'pointer';
    rect.addEventListener('click', () => this.selectDoor(door.id));
    
    // Draw door arc (opening)
    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const radius = door.width;
    const startAngle = 0;
    const endAngle = Math.PI / 2;
    const startX = door.position.x;
    const startY = door.position.y - door.width / 2;
    const endX = door.position.x + door.width / 2;
    const endY = door.position.y;
    
    arc.setAttribute('d', `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`);
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', '#654321');
    arc.setAttribute('stroke-width', '2');
    arc.setAttribute('stroke-dasharray', '3,3');
    
    group.appendChild(rect);
    group.appendChild(arc);
    svg.appendChild(group);
  }

  renderWindows(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvasSvg?.nativeElement) return;
    
    const svg = this.canvasSvg.nativeElement;
    const existingWindows = svg.querySelectorAll('.window-element');
    existingWindows.forEach(el => el.remove());

    this.windows().forEach(window => {
      this.renderWindow(window);
    });
  }

  renderWindow(window: Window): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvasSvg?.nativeElement || typeof document === 'undefined') return;
    
    const svg = this.canvasSvg.nativeElement;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'window-element');
    group.setAttribute('data-window-id', window.id);
    
    // Draw window rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', (window.position.x - window.width / 2).toString());
    rect.setAttribute('y', (window.position.y - window.height / 2).toString());
    rect.setAttribute('width', window.width.toString());
    rect.setAttribute('height', window.height.toString());
    rect.setAttribute('fill', '#87CEEB');
    rect.setAttribute('stroke', '#4682B4');
    rect.setAttribute('stroke-width', '2');
    rect.style.cursor = 'pointer';
    rect.addEventListener('click', () => this.selectWindow(window.id));
    
    // Draw window cross (mullions)
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', window.position.x.toString());
    line1.setAttribute('y1', (window.position.y - window.height / 2).toString());
    line1.setAttribute('x2', window.position.x.toString());
    line1.setAttribute('y2', (window.position.y + window.height / 2).toString());
    line1.setAttribute('stroke', '#4682B4');
    line1.setAttribute('stroke-width', '1');
    
    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', (window.position.x - window.width / 2).toString());
    line2.setAttribute('y1', window.position.y.toString());
    line2.setAttribute('x2', (window.position.x + window.width / 2).toString());
    line2.setAttribute('y2', window.position.y.toString());
    line2.setAttribute('stroke', '#4682B4');
    line2.setAttribute('stroke-width', '1');
    
    group.appendChild(rect);
    group.appendChild(line1);
    group.appendChild(line2);
    svg.appendChild(group);
  }

  renderColumns(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvasSvg?.nativeElement) return;
    
    const svg = this.canvasSvg.nativeElement;
    const existingColumns = svg.querySelectorAll('.column-element');
    existingColumns.forEach(el => el.remove());

    this.columns().forEach(column => {
      this.renderColumn(column);
    });
  }

  renderColumn(column: Column): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvasSvg?.nativeElement || typeof document === 'undefined') return;
    
    const svg = this.canvasSvg.nativeElement;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('class', 'column-element');
    circle.setAttribute('data-column-id', column.id);
    circle.setAttribute('cx', column.position.x.toString());
    circle.setAttribute('cy', column.position.y.toString());
    circle.setAttribute('r', (column.diameter / 2).toString());
    circle.setAttribute('fill', '#808080');
    circle.setAttribute('stroke', '#606060');
    circle.setAttribute('stroke-width', '2');
    circle.style.cursor = 'pointer';
    circle.addEventListener('click', () => this.selectColumn(column.id));
    
    svg.appendChild(circle);
  }

  renderStaircases(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvasSvg?.nativeElement) return;
    
    const svg = this.canvasSvg.nativeElement;
    const existingStaircases = svg.querySelectorAll('.staircase-element');
    existingStaircases.forEach(el => el.remove());

    this.staircases().forEach(staircase => {
      this.renderStaircase(staircase);
    });
  }

  renderStaircase(staircase: Staircase): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvasSvg?.nativeElement || typeof document === 'undefined') return;
    
    const svg = this.canvasSvg.nativeElement;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'staircase-element');
    group.setAttribute('data-staircase-id', staircase.id);
    
    // Draw staircase rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', (staircase.position.x - staircase.width / 2).toString());
    rect.setAttribute('y', (staircase.position.y - staircase.length / 2).toString());
    rect.setAttribute('width', staircase.width.toString());
    rect.setAttribute('height', staircase.length.toString());
    rect.setAttribute('fill', '#D3D3D3');
    rect.setAttribute('stroke', '#A9A9A9');
    rect.setAttribute('stroke-width', '2');
    rect.style.cursor = 'pointer';
    rect.addEventListener('click', () => this.selectStaircase(staircase.id));
    
    // Draw step lines
    const stepCount = 10;
    const stepHeight = staircase.length / stepCount;
    for (let i = 1; i < stepCount; i++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const y = staircase.position.y - staircase.length / 2 + i * stepHeight;
      line.setAttribute('x1', (staircase.position.x - staircase.width / 2).toString());
      line.setAttribute('y1', y.toString());
      line.setAttribute('x2', (staircase.position.x + staircase.width / 2).toString());
      line.setAttribute('y2', y.toString());
      line.setAttribute('stroke', '#A9A9A9');
      line.setAttribute('stroke-width', '1');
      group.appendChild(line);
    }
    
    // Draw direction arrow
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const arrowY = staircase.position.y;
    const arrowX = staircase.position.x;
    const arrowSize = 20;
    if (staircase.direction === 'up') {
      arrow.setAttribute('d', `M ${arrowX} ${arrowY - arrowSize} L ${arrowX - 10} ${arrowY} L ${arrowX + 10} ${arrowY} Z`);
    } else {
      arrow.setAttribute('d', `M ${arrowX} ${arrowY + arrowSize} L ${arrowX - 10} ${arrowY} L ${arrowX + 10} ${arrowY} Z`);
    }
    arrow.setAttribute('fill', '#000000');
    
    group.appendChild(rect);
    group.appendChild(arrow);
    svg.appendChild(group);
  }

  renderComponents(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvasSvg?.nativeElement) return;
    
    const svg = this.canvasSvg.nativeElement;
    const existingComponents = svg.querySelectorAll('.component-element');
    existingComponents.forEach(el => el.remove());

    this.components().forEach(component => {
      this.renderComponent(component);
    });

    // Render preview component if placing
    if (this.isPlacingComponent() && this.componentToPlace()) {
      const preview = this.componentToPlace()!;
      this.renderComponent(preview, true);
    }
  }

  renderComponent(component: PlacedComponent, isPreview: boolean = false): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.canvasSvg?.nativeElement || typeof document === 'undefined') return;
    
    const svg = this.canvasSvg.nativeElement;
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', isPreview ? 'component-preview' : 'component-element');
    if (!isPreview) {
      group.setAttribute('data-component-id', component.id);
    }
    
    // Draw component rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', (component.position.x - component.width / 2).toString());
    rect.setAttribute('y', (component.position.y - component.height / 2).toString());
    rect.setAttribute('width', component.width.toString());
    rect.setAttribute('height', component.height.toString());
    rect.setAttribute('fill', isPreview ? '#4CAF50' : '#9E9E9E');
    rect.setAttribute('fill-opacity', isPreview ? '0.5' : '0.8');
    rect.setAttribute('stroke', isPreview ? '#2E7D32' : '#616161');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('rx', '4');
    if (!isPreview) {
      rect.style.cursor = 'pointer';
      rect.addEventListener('click', () => this.selectComponent(component.id));
    }
    
    group.appendChild(rect);
    svg.appendChild(group);
  }

  // Selection methods
  selectDoor(doorId: string): void {
    const door = this.doors().find(d => d.id === doorId);
    if (door) {
      this.selectedItem.set({
        type: 'door',
        id: door.id,
        length: door.width,
        width: door.width,
        height: door.height,
        rotation: door.rotation
      });
    }
  }

  selectWindow(windowId: string): void {
    const window = this.windows().find(w => w.id === windowId);
    if (window) {
      this.selectedItem.set({
        type: 'window',
        id: window.id,
        length: window.width,
        width: window.width,
        height: window.height,
        rotation: window.rotation
      });
    }
  }

  selectColumn(columnId: string): void {
    const column = this.columns().find(c => c.id === columnId);
    if (column) {
      this.selectedItem.set({
        type: 'column',
        id: column.id,
        length: column.diameter,
        width: column.diameter,
        height: column.height
      });
    }
  }

  selectStaircase(staircaseId: string): void {
    const staircase = this.staircases().find(s => s.id === staircaseId);
    if (staircase) {
      this.selectedItem.set({
        type: 'staircase',
        id: staircase.id,
        length: staircase.length,
        width: staircase.width,
        rotation: staircase.rotation
      });
    }
  }

  selectComponent(componentId: string): void {
    const component = this.components().find(c => c.id === componentId);
    if (component) {
      this.selectedItem.set({
        type: 'component',
        id: component.id,
        length: component.width,
        width: component.width,
        height: component.height,
        rotation: component.rotation
      });
    }
  }

  // Update handleSelection to include new component types
  handleSelection(point: Point): void {
    // Check doors
    const clickedDoor = this.doors().find(door => {
      const dist = this.calculateDistance(point, door.position);
      return dist < door.width / 2;
    });
    if (clickedDoor) {
      this.selectDoor(clickedDoor.id);
      return;
    }

    // Check windows
    const clickedWindow = this.windows().find(window => {
      const distX = Math.abs(point.x - window.position.x);
      const distY = Math.abs(point.y - window.position.y);
      return distX < window.width / 2 && distY < window.height / 2;
    });
    if (clickedWindow) {
      this.selectWindow(clickedWindow.id);
      return;
    }

    // Check columns
    const clickedColumn = this.columns().find(column => {
      const dist = this.calculateDistance(point, column.position);
      return dist < column.diameter / 2;
    });
    if (clickedColumn) {
      this.selectColumn(clickedColumn.id);
      return;
    }

    // Check staircases
    const clickedStaircase = this.staircases().find(staircase => {
      const distX = Math.abs(point.x - staircase.position.x);
      const distY = Math.abs(point.y - staircase.position.y);
      return distX < staircase.width / 2 && distY < staircase.length / 2;
    });
    if (clickedStaircase) {
      this.selectStaircase(clickedStaircase.id);
      return;
    }

    // Check components
    const clickedComponent = this.components().find(component => {
      const distX = Math.abs(point.x - component.position.x);
      const distY = Math.abs(point.y - component.position.y);
      return distX < component.width / 2 && distY < component.height / 2;
    });
    if (clickedComponent) {
      this.selectComponent(clickedComponent.id);
      return;
    }

    // Check walls
    const clickedWall = this.walls().find(wall => {
      const dist = this.distanceToLineSegment(point, wall.start, wall.end);
      return dist < 20;
    });
    if (clickedWall) {
      this.selectWall(clickedWall.id);
      return;
    }

    // Check rooms
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
      return;
    }

    this.selectedItem.set(null);
  }
}
