// App.tsx
import React, { useState, useCallback } from 'react';
import EurasiaMap from './EurasiaMap';
import './sidebar.css';

interface PointData {
    node_id: string;
    latitude: number;
    longitude: number;
}

const DEFAULT_SIDEBAR_WIDTH = 320;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 600;

const App = () => {
    const [showRightSidebar, setShowRightSidebar] = useState(true);
    const [showLeftSidebar, setShowLeftSidebar] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState<PointData | null>(null);
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
    const [isResizing, setIsResizing] = useState(false);

    const handlePointClick = (point: PointData) => {
        console.log('Point clicked:', point);
        setSelectedPoint(point);
        setShowLeftSidebar(true);
    };

    const startResizing = useCallback((side: 'left' | 'right') => {
        setIsResizing(true);

        const handleMouseMove = (e: MouseEvent) => {
            if (side === 'left') {
                const width = e.clientX;
                setLeftSidebarWidth(Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH));
            } else {
                const width = window.innerWidth - e.clientX;
                setRightSidebarWidth(Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH));
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            position: 'relative',
            overflow: 'hidden',
            cursor: isResizing ? 'ew-resize' : 'default'
        }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <EurasiaMap selectedPoint={selectedPoint} onPointClick={handlePointClick} />
            </div>

            {/* Left Sidebar */}
            <div
                className={`sidebar left ${showLeftSidebar ? 'open' : 'closed'}`}
                style={{
                    zIndex: 10,
                    width: leftSidebarWidth,
                    minWidth: leftSidebarWidth,
                }}
            >
                <button
                    className="toggle-button"
                    onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                >
                    {showLeftSidebar ? '←' : '→'}
                </button>

                <div className="sidebar-content">
                    <h2>Point Details {selectedPoint && `(${selectedPoint.node_id})`}</h2>

                    <div className="info-panel">
                        <h3>Location</h3>
                        <p>Node ID: {selectedPoint?.node_id || 'N/A'}</p>
                        <p>Latitude: {selectedPoint?.latitude?.toFixed(4)}°N</p>
                        <p>Longitude: {selectedPoint?.longitude?.toFixed(4)}°E</p>
                    </div>

                    <div className="info-panel">
                        <h3>Measurements</h3>
                        <p>Temperature: 23.5°C</p>
                        <p>Pressure: 1013 hPa</p>
                        <p>Humidity: 65%</p>
                    </div>
                </div>

                <div
                    className="resize-handle right"
                    onMouseDown={() => startResizing('left')}
                />
            </div>

            {/* Right Sidebar */}
            <div
                className={`sidebar right ${showRightSidebar ? 'open' : 'closed'}`}
                style={{
                    zIndex: 10,
                    width: rightSidebarWidth,
                    minWidth: rightSidebarWidth,
                }}
            >
                <button
                    className="toggle-button"
                    onClick={() => setShowRightSidebar(!showRightSidebar)}
                >
                    {showRightSidebar ? '→' : '←'}
                </button>

                <div className="sidebar-content">
                    <h2>Map Information</h2>

                    <div className="info-panel">
                        <h3>Statistics</h3>
                        <p>Total Points: 1,234</p>
                        <p>Active Regions: 56</p>
                    </div>
                </div>

                <div
                    className="resize-handle left"
                    onMouseDown={() => startResizing('right')}
                />
            </div>
        </div>
    );
};

export default App;