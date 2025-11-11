import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// VR Gallery Tour (Street View style)
// - Show 360 panorama images
// - Hotspots to move between rooms
// - Tooltip + Mini-map

interface HotspotConfig {
	x: number;
	y: number;
	z: number;
	target: string;
	label: string;
}

interface RoomConfig {
	id: string;
	image: string;
	hotspots: HotspotConfig[];
}

const rooms: RoomConfig[] = [
	{
		id: "room1",
		image: "/gallery/room2.jpg",
		hotspots: [
			{ x: 5, y: 0, z: -2, target: "room2", label: "Go to Room 2" },
		],
	},
	{
		id: "room2",
		image: "/gallery/room2.jpg",
		hotspots: [
			{ x: -5, y: 0, z: 2, target: "room1", label: "Back to Room 1" },
		],
	},
];

export default function VRGalleryTour() {
	const mountRef = useRef<HTMLDivElement | null>(null);
	const [currentRoom, setCurrentRoom] = useState("room1");
	const [tooltip, setTooltip] = useState<string | null>(null);

	useEffect(() => {
		const mount = mountRef.current!;
		// --- scene/camera ---
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(
			70,
			mount.clientWidth / mount.clientHeight,
			0.1,
			1000
		);
		camera.position.set(0, 0, 0);

		// --- renderer ---
		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
		renderer.setSize(mount.clientWidth, mount.clientHeight);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // cap DPR
		(renderer as any).outputColorSpace = THREE.SRGBColorSpace as any; // three r155+
		mount.appendChild(renderer.domElement);

		// --- sphere pano ---
		const R = 100; // radius nhỏ hơn là đủ, tránh “cảm giác mờ” do scale quá lớn
		const sphere = new THREE.Mesh(
			new THREE.SphereGeometry(R, 128, 128), // tăng segments
			new THREE.MeshBasicMaterial({ side: THREE.BackSide })
		);
		scene.add(sphere);

		// --- picking ---
		const raycaster = new THREE.Raycaster();
		const mouse = new THREE.Vector2();
		const hotspotMeshes: THREE.Mesh[] = [];

		function loadRoom(id: string) {
			const room = rooms.find((r) => r.id === id);
			if (!room) return;
			setCurrentRoom(id);

			new THREE.TextureLoader().load(room.image, (tex) => {
				// chất lượng texture
				(tex as any).colorSpace = THREE.SRGBColorSpace;  // r155+
				tex.minFilter = THREE.LinearFilter;
				tex.magFilter = THREE.LinearFilter;
				tex.generateMipmaps = false;
				tex.anisotropy = renderer.capabilities.getMaxAnisotropy(); // quan trọng

				const mat = sphere.material as THREE.MeshBasicMaterial;
				mat.map = tex;
				mat.needsUpdate = true;
			});

			// reset hotspots
			hotspotMeshes.forEach((m) => scene.remove(m));
			hotspotMeshes.length = 0;

			// add hotspots
			room.hotspots.forEach((h) => {
				const hotspot = new THREE.Mesh(
					new THREE.SphereGeometry(1.5, 16, 16),
					new THREE.MeshBasicMaterial({ color: 0xff3b30 })
				);
				hotspot.position.set(h.x, h.y, h.z); // nhớ cấu hình theo bán kính R
				hotspot.userData = { target: h.target, label: h.label };
				scene.add(hotspot);
				hotspotMeshes.push(hotspot);
			});
		}

		loadRoom(currentRoom);

		// --- simple look controls (drag to look) ---
		let isUserInteracting = false;
		let lon = 0, lat = 0;
		let phi = 0, theta = 0;
		let onDownX = 0, onDownY = 0, onDownLon = 0, onDownLat = 0;

		function onPointerDown(e: MouseEvent) {
			isUserInteracting = true;
			onDownX = e.clientX;
			onDownY = e.clientY;
			onDownLon = lon;
			onDownLat = lat;
		}
		function onPointerMove(e: MouseEvent) {
			if (isUserInteracting) {
				lon = (onDownX - e.clientX) * 0.1 + onDownLon;
				lat = (e.clientY - onDownY) * 0.1 + onDownLat;
			}

			// mouse NDC theo bounding rect (để raycaster chính xác khi canvas bị CSS scale)
			const rect = renderer.domElement.getBoundingClientRect();
			mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

			raycaster.setFromCamera(mouse, camera);
			const hit = raycaster.intersectObjects(hotspotMeshes);
			if (hit.length > 0) setTooltip(hit[0].object.userData.label ?? null);
			else setTooltip(null);
		}
		function onPointerUp() {
			isUserInteracting = false;
		}
		function onClick() {
			raycaster.setFromCamera(mouse, camera);
			const hit = raycaster.intersectObjects(hotspotMeshes);
			if (hit.length > 0) {
				const target = hit[0].object.userData.target as string | undefined;
				if (target) loadRoom(target);
			}
		}

		renderer.domElement.addEventListener('mousedown', onPointerDown);
		renderer.domElement.addEventListener('mousemove', onPointerMove);
		renderer.domElement.addEventListener('mouseup', onPointerUp);
		renderer.domElement.addEventListener('click', onClick);

		// --- render loop ---
		const target = new THREE.Vector3();
		function animate() {
			requestAnimationFrame(animate);
			lat = Math.max(-85, Math.min(85, lat));
			phi = THREE.MathUtils.degToRad(90 - lat);
			theta = THREE.MathUtils.degToRad(lon);
			target.set(
				R * Math.sin(phi) * Math.cos(theta),
				R * Math.cos(phi),
				R * Math.sin(phi) * Math.sin(theta)
			);
			camera.lookAt(target);
			renderer.render(scene, camera);
		}
		animate();

		// --- resize ---
		const onResize = () => {
			camera.aspect = mount.clientWidth / mount.clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(mount.clientWidth, mount.clientHeight);
		};
		window.addEventListener('resize', onResize);

		return () => {
			window.removeEventListener('resize', onResize);
			renderer.setAnimationLoop(null as any);
			renderer.domElement.removeEventListener('mousedown', onPointerDown);
			renderer.domElement.removeEventListener('mousemove', onPointerMove);
			renderer.domElement.removeEventListener('mouseup', onPointerUp);
			renderer.domElement.removeEventListener('click', onClick);
			mount.removeChild(renderer.domElement);
		};
	}, []);


	return (
		<div className="relative w-full h-screen">
			<div ref={mountRef} className="w-full h-full" />

			{/* Tooltip */}
			{tooltip && (
				<div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
					{tooltip}
				</div>
			)}

			{/* Mini-map */}
			<div className="absolute top-4 right-4 bg-white/80 border rounded-lg p-2 text-xs shadow">
				<p className="font-bold mb-1">Mini-map</p>
				{rooms.map((r) => (
					<div
						key={r.id}
						className={`cursor-pointer mb-1 px-2 py-1 rounded ${currentRoom === r.id ? "bg-blue-500 text-white" : "bg-gray-200"
							}`}
						onClick={() => setCurrentRoom(r.id)}
					>
						{r.id}
					</div>
				))}
			</div>
		</div>
	);
}