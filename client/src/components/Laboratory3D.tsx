import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThreeScene } from '@/hooks/useThreeScene';

interface Laboratory3DProps {
  onEquipmentClick?: (equipmentName: string) => void;
}

export function Laboratory3D({ onEquipmentClick }: Laboratory3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const equipmentGroupRef = useRef<Map<string, THREE.Group>>(new Map());
  const [hoveredEquipment, setHoveredEquipment] = useState<string | null>(null);

  const { scene, camera, renderer } = useThreeScene({
    containerRef,
    onSceneReady: (scene, camera, renderer) => {
      // Create lab environment
      createLabEnvironment(scene);
      
      // Create equipment
      const vacuumReactor = createVacuumReactor(scene);
      const coldTrap = createColdTrap(scene);
      const ultrasonicReactor = createUltrasonicReactor(scene);
      const vacuumPump = createVacuumPump(scene);
      const aiPanel = createAIPanel(scene);
      const hologramDashboard = createHologramDashboard(scene);

      // Register equipment for raycasting
      equipmentGroupRef.current.set('vacuum-reactor', vacuumReactor);
      equipmentGroupRef.current.set('cold-trap', coldTrap);
      equipmentGroupRef.current.set('ultrasonic-reactor', ultrasonicReactor);
      equipmentGroupRef.current.set('vacuum-pump', vacuumPump);
      equipmentGroupRef.current.set('ai-panel', aiPanel);
      equipmentGroupRef.current.set('hologram-dashboard', hologramDashboard);

      // Add grid floor
      const gridHelper = new THREE.GridHelper(40, 40, 0x00f0ff, 0x0f1535);
      gridHelper.position.y = -2;
      scene.add(gridHelper);

      // Setup raycasting for equipment interaction
      renderer.domElement.addEventListener('click', (event) => {
        mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (camera) {
          raycasterRef.current.setFromCamera(mouseRef.current, camera);
          
          const equipmentObjects = Array.from(equipmentGroupRef.current.values());
          const intersects = raycasterRef.current.intersectObjects(equipmentObjects, true);

          if (intersects.length > 0) {
            // Find which equipment was clicked
            equipmentGroupRef.current.forEach((group, name) => {
              if (intersects[0].object.parent === group || intersects[0].object === group) {
                onEquipmentClick?.(name);
              }
            });
          }
        }
      });

      // Setup mouse move for hover effect
      renderer.domElement.addEventListener('mousemove', (event) => {
        mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if (camera) {
          raycasterRef.current.setFromCamera(mouseRef.current, camera);
          
          const equipmentObjects = Array.from(equipmentGroupRef.current.values());
          const intersects = raycasterRef.current.intersectObjects(equipmentObjects, true);

          if (intersects.length > 0) {
            equipmentGroupRef.current.forEach((group, name) => {
              if (intersects[0].object.parent === group || intersects[0].object === group) {
                setHoveredEquipment(name);
              }
            });
          } else {
            setHoveredEquipment(null);
          }
        }
      });
    },
  });

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-bg-dark-0 relative overflow-hidden cursor-pointer"
    />
  );
}

// Helper functions to create equipment

function createLabEnvironment(scene: THREE.Scene) {
  // Create a subtle background environment
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add some circuit-like patterns
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const geometry = new THREE.PlaneGeometry(100, 100);
  const plane = new THREE.Mesh(geometry, material);
  plane.position.z = -50;
  scene.add(plane);
}

function createVacuumReactor(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = 'vacuum-reactor';

  // Main cylinder body
  const cylinderGeometry = new THREE.CylinderGeometry(2, 2, 6, 32);
  const cylinderMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a2547,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.2,
  });
  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  group.add(cylinder);

  // Glowing edge
  const edgeGeometry = new THREE.TorusGeometry(2.1, 0.1, 16, 32);
  const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
  edge.position.y = 3;
  group.add(edge);

  group.position.set(-8, 0, 0);
  scene.add(group);

  // Idle animation
  const startTime = Date.now();
  const animate = () => {
    const elapsed = (Date.now() - startTime) / 1000;
    group.rotation.y = Math.sin(elapsed * 0.5) * 0.1;
    group.position.y = Math.sin(elapsed * 0.8) * 0.3;
    requestAnimationFrame(animate);
  };
  animate();

  return group;
}

function createColdTrap(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = 'cold-trap';

  // Cone shape for cold trap
  const coneGeometry = new THREE.ConeGeometry(1.5, 4, 32);
  const coneMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a2547,
    metalness: 0.7,
    roughness: 0.3,
    emissive: 0xb700ff,
    emissiveIntensity: 0.15,
  });
  const cone = new THREE.Mesh(coneGeometry, coneMaterial);
  cone.castShadow = true;
  cone.receiveShadow = true;
  group.add(cone);

  group.position.set(0, 0, -8);
  scene.add(group);

  // Idle animation
  const startTime = Date.now();
  const animate = () => {
    const elapsed = (Date.now() - startTime) / 1000;
    group.rotation.x = Math.sin(elapsed * 0.6) * 0.05;
    requestAnimationFrame(animate);
  };
  animate();

  return group;
}

function createUltrasonicReactor(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = 'ultrasonic-reactor';

  // Cube shape for ultrasonic reactor
  const cubeGeometry = new THREE.BoxGeometry(2, 3, 2);
  const cubeMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a2547,
    metalness: 0.6,
    roughness: 0.4,
    emissive: 0x39ff14,
    emissiveIntensity: 0.1,
  });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.castShadow = true;
  cube.receiveShadow = true;
  group.add(cube);

  group.position.set(8, 0, 0);
  scene.add(group);

  // Idle animation
  const startTime = Date.now();
  const animate = () => {
    const elapsed = (Date.now() - startTime) / 1000;
    group.rotation.z = Math.sin(elapsed * 0.7) * 0.08;
    requestAnimationFrame(animate);
  };
  animate();

  return group;
}

function createVacuumPump(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = 'vacuum-pump';

  // Sphere for pump
  const sphereGeometry = new THREE.SphereGeometry(1.2, 32, 32);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a2547,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0xffd700,
    emissiveIntensity: 0.1,
  });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  group.add(sphere);

  group.position.set(0, 0, 8);
  scene.add(group);

  // Idle animation
  const startTime = Date.now();
  const animate = () => {
    const elapsed = (Date.now() - startTime) / 1000;
    group.scale.x = 1 + Math.sin(elapsed * 1.2) * 0.1;
    group.scale.z = 1 + Math.sin(elapsed * 1.2) * 0.1;
    requestAnimationFrame(animate);
  };
  animate();

  return group;
}

function createAIPanel(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = 'ai-panel';

  // Flat panel
  const panelGeometry = new THREE.PlaneGeometry(3, 4);
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f1535,
    metalness: 0.5,
    roughness: 0.5,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.2,
  });
  const panel = new THREE.Mesh(panelGeometry, panelMaterial);
  panel.castShadow = true;
  panel.receiveShadow = true;
  group.add(panel);

  group.position.set(-8, 3, 8);
  group.rotation.y = Math.PI / 6;
  scene.add(group);

  // Idle animation
  const startTime = Date.now();
  const animate = () => {
    const elapsed = (Date.now() - startTime) / 1000;
    group.position.y = 3 + Math.sin(elapsed * 0.5) * 0.2;
    requestAnimationFrame(animate);
  };
  animate();

  return group;
}

function createHologramDashboard(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = 'hologram-dashboard';

  // Hologram-like structure
  const dashGeometry = new THREE.BoxGeometry(4, 0.2, 4);
  const dashMaterial = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    metalness: 0.3,
    roughness: 0.7,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.7,
  });
  const dashboard = new THREE.Mesh(dashGeometry, dashMaterial);
  dashboard.castShadow = true;
  dashboard.receiveShadow = true;
  group.add(dashboard);

  group.position.set(8, 2, -8);
  scene.add(group);

  // Idle animation
  const startTime = Date.now();
  const animate = () => {
    const elapsed = (Date.now() - startTime) / 1000;
    group.rotation.x = Math.sin(elapsed * 0.4) * 0.1;
    group.rotation.z = Math.cos(elapsed * 0.5) * 0.08;
    requestAnimationFrame(animate);
  };
  animate();

  return group;
}
