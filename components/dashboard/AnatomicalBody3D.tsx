import { Canvas, useLoader } from '@react-three/fiber/native';
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { MuscleColorMap } from './AnatomicalMuscleBody';

interface Props {
    colors: MuscleColorMap;
    selectedMuscle?: string | null;
    onSelectMuscle?: (muscle: string) => void;
    width?: number;
    height?: number;
    viewSide?: 'Front' | 'Back';
}

const MODEL = require('../../assets/models/anatomy.glb');

const classify = (raw: string): keyof MuscleColorMap | null => {
    const n = raw.toLowerCase().replace(/_/g, ' ');
    if (/pectoralis/.test(n)) return 'Peito';
    if (/deltoid/.test(n)) return 'Ombros';
    if (/biceps brachii|brachialis/.test(n)) return 'Bíceps';
    if (/triceps brachii|anconeus/.test(n)) return 'Tríceps';
    if (/trapezius/.test(n)) return 'Trapézio';
    if (/latissimus|rhomboid|erector spinae|spinalis|multifidus|rotatores/.test(n)) return 'Costas';
    if (/rectus abdominis|oblique|transversus abdominis/.test(n)) return 'Abdômen';
    if (/gluteus/.test(n)) return 'Glúteos';
    if (/quadriceps|rectus femoris|vastus/.test(n)) return 'Quadríceps';
    if (/biceps femoris|semitendinosus|semimembranosus/.test(n)) return 'Isquiotibiais';
    if (/gastrocnemius|soleus/.test(n)) return 'Panturrilhas';
    if (/carpi|digitorum|pollicis|pronator|brachioradialis/.test(n)) return 'Antebraços';
    return null;
};

function MuscleModel({ angle, colors, selectedMuscle, onSelectMuscle }: Props & { angle: number }) {
    const gltf = useLoader(GLTFLoader, MODEL) as any;
    const model = useMemo(() => {
        const root = new THREE.Group();
        const source = gltf.scene.clone(true);
        source.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(source);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const scale = 2.85 / size.z;

        source.traverse((child: any) => {
            if (!child.isMesh) return;
            const geometry = child.geometry.clone();
            // GLB meshes use their own local transforms. Bake every transform into
            // the geometry before converting BodyParts3D coordinates to Three.js.
            geometry.applyMatrix4(child.matrixWorld);
            const positions = geometry.getAttribute('position');
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                const z = positions.getZ(i);
                positions.setXYZ(i, (x - center.x) * scale, (z - center.z) * scale, -(y - center.y) * scale);
            }
            positions.needsUpdate = true;
            geometry.computeVertexNormals();
            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
            const muscle = classify(child.name || '');
            const active = muscle && colors[muscle];
            const selected = muscle === selectedMuscle;
            const material = new THREE.MeshStandardMaterial({
                color: selected ? '#F97316' : active || '#A63D45',
                emissive: selected ? '#7C2D12' : active ? active : '#26090C',
                emissiveIntensity: selected ? 0.3 : active ? 0.16 : 0.07,
                roughness: 0.78,
                metalness: 0,
                side: THREE.DoubleSide,
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.userData.muscle = muscle;
            mesh.userData.isTendon = /tendon|ligament|fascia|retinaculum|membrane/i.test(child.name || '');
            if (mesh.userData.isTendon) {
                material.color.set('#D5C5AC');
                material.emissive.set('#241D15');
                material.emissiveIntensity = 0.04;
            }
            root.add(mesh);
        });
        return root;
    }, [gltf.scene, colors, selectedMuscle]);

    return (
        <group rotation={[0, angle, 0]}>
            <primitive
                object={model}
                onClick={(event: any) => {
                    event.stopPropagation();
                    const muscle = event.object?.userData?.muscle;
                    if (muscle) onSelectMuscle?.(muscle);
                }}
            />
        </group>
    );
}

export function AnatomicalBody3D({ width = 250, height = 355, viewSide = 'Front', ...props }: Props) {
    const [angle, setAngle] = useState(0);
    const startAngle = useRef(0);
    const pan = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4,
        onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 4,
        onPanResponderGrant: () => { startAngle.current = angle; },
        onPanResponderMove: (_, gesture) => setAngle(startAngle.current + gesture.dx * 0.012),
    }), [angle]);

    useEffect(() => {
        setAngle(viewSide === 'Front' ? 0 : Math.PI);
    }, [viewSide]);

    return (
        <View style={{ width, height }}>
            <Canvas
                camera={{ position: [0, 0, 4.7], fov: 38 }}
                gl={{ antialias: true, alpha: true }}
                style={{ pointerEvents: 'none' }}
            >
                <ambientLight intensity={1.15} color="#FFF8F0" />
                <directionalLight position={[3, 4, 5]} intensity={2.0} color="#FFF4E6" />
                <directionalLight position={[-3, 1, -4]} intensity={0.9} color="#E8EEF8" />
                <Suspense fallback={null}>
                    <MuscleModel {...props} angle={angle} />
                </Suspense>
            </Canvas>
            <View
                {...pan.panHandlers}
                style={[{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                }, { touchAction: 'none' } as any]}
            />
        </View>
    );
}
