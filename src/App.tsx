// ============================================================================
// App.tsx
// Main application component that manages the layout and state for an interactive
// map interface with resizable sidebars and point selection functionality.
//
// Key features:
// - Interactive map display
// - Resizable left and right sidebars
// - Point selection and detail display
// - Responsive layout with collapsible panels
// ============================================================================

import React, { useState, useCallback } from 'react';
import EurasiaMap from './EurasiaMap';
import './sidebar.css';
// PointData interface defines the structure of geographic point data
// including properties like node_id, latitude, and longitude
import { PointData } from "./types";

// ============================================================================
// Constants
// Define fixed values for sidebar width constraints
// ============================================================================
const DEFAULT_SIDEBAR_WIDTH = 320;  // Initial width in pixels for both sidebars
const MIN_SIDEBAR_WIDTH = 200;      // Minimum width when resizing sidebars
const MAX_SIDEBAR_WIDTH = 600;      // Maximum width when resizing sidebars

const App = () => {
    // ========================================================================
    // State Management
    // Using React hooks for component state
    // Each useState call returns [currentValue, setterFunction]
    // ========================================================================

    // Sidebar visibility states
    // Controls whether each sidebar is expanded or collapsed
    const [showRightSidebar, setShowRightSidebar] = useState(true);
    const [showLeftSidebar, setShowLeftSidebar] = useState(false);

    // Point selection state
    // TypeScript union type allows either PointData object or null
    // null indicates no point is currently selected
    const [selectedPoint, setSelectedPoint] = useState<PointData | null>(null);

    // Sidebar width states
    // Tracks current width of each sidebar, initialized to default value
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);

    // Resize operation state
    // Tracks whether user is currently dragging a sidebar resize handle
    const [isResizing, setIsResizing] = useState(false);

    // ========================================================================
    // Event Handlers
    // Callbacks for user interactions
    // ========================================================================

    // Handles clicks on map points
    // Takes a PointData object representing the clicked point
    const handlePointClick = (point: PointData) => {
        console.log('Point clicked:', point);
        // If clicking already selected point, deselect it and close sidebar
        if (selectedPoint && selectedPoint.node_id === point.node_id) {
            setSelectedPoint(null);
            setShowLeftSidebar(false);
        } else {
            // Otherwise, select new point and show sidebar
            setSelectedPoint(point);
            setShowLeftSidebar(true);
        }
    };

    // Handles sidebar resizing operations
    // Wrapped in useCallback to maintain reference stability
    // 'side' parameter specifies which sidebar is being resized
    const startResizing = useCallback((side: 'left' | 'right') => {
        setIsResizing(true);

        // --- Mouse Event Handlers ---
        // Handles mouse movement during resize operation
        const handleMouseMove = (e: MouseEvent) => {
            if (side === 'left') {
                // For left sidebar, width is distance from left edge
                const width = e.clientX;
                // Clamp width between min and max values
                setLeftSidebarWidth(Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH));
            } else {
                // For right sidebar, width is distance from right edge
                const width = window.innerWidth - e.clientX;
                setRightSidebarWidth(Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH));
            }
        };

        // Cleanup handler for when mouse is released
        const handleMouseUp = () => {
            setIsResizing(false);
            // Remove event listeners to prevent memory leaks
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        // Add event listeners for drag operation
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []); // Empty dependency array since no dependencies change

    // ========================================================================
    // Component Render
    // Returns the JSX for the entire application layout
    // ========================================================================
    return (
        // Main container with viewport dimensions and overflow handling
        <div style={{
            width: '100vw',
            height: '100vh',
            position: 'relative',
            overflow: 'hidden',
            // Change cursor during resize operations
            cursor: isResizing ? 'ew-resize' : 'default'
        }}>
            {/* ----------------------------------------------------------------
                Map Section
                Absolute positioning fills the entire viewport
                ---------------------------------------------------------------- */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <EurasiaMap
                    selectedPoint={selectedPoint}
                    onPointClick={handlePointClick}
                />
            </div>

            {/* ----------------------------------------------------------------
                Left Sidebar - Point Details
                Conditionally rendered when a point is selected
                Includes point information and location details
                ---------------------------------------------------------------- */}
            {selectedPoint && (
                <div
                    // Dynamic className controls sidebar open/closed state
                    className={`sidebar left ${showLeftSidebar ? 'open' : 'closed'}`}
                    style={{
                        zIndex: 10,
                        width: leftSidebarWidth,
                        minWidth: leftSidebarWidth,
                    }}
                >
                    {/* Toggle Button - Controls sidebar visibility */}
                    <button
                        className="toggle-button"
                        onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                    >
                        {showLeftSidebar ? '←' : '→'}
                    </button>

                    {/* Sidebar Content */}
                    <div className="sidebar-content">
                        {/* Point details header with optional ID display */}
                        <h2>Point Details {selectedPoint && `(${selectedPoint.node_id})`}</h2>

                        {/* Location Information Panel */}
                        <div className="info-panel">
                            <h3>Location</h3>
                            {/* Optional chaining (?.) used for safe access to potentially null values */}
                            <p>Node ID: {selectedPoint?.node_id || 'N/A'}</p>
                            <p>Latitude: {selectedPoint?.latitude?.toFixed(4)}°N</p>
                            <p>Longitude: {selectedPoint?.longitude?.toFixed(4)}°E</p>
                        </div>

                        {/* Additional Details Panel - Reserved for future use */}
                        <div className="info-panel">
                            <h3>Details</h3>
                        </div>
                    </div>

                    {/* Resize Handle - Enables drag-to-resize functionality */}
                    <div
                        className="resize-handle right"
                        onMouseDown={() => startResizing('left')}
                    />
                </div>
            )}

            {/* ----------------------------------------------------------------
                Right Sidebar - Map Information
                Always present but can be collapsed
                Contains general map statistics and controls
                ---------------------------------------------------------------- */}
            <div
                className={`sidebar right ${showRightSidebar ? 'open' : 'closed'}`}
                style={{
                    zIndex: 10,
                    width: rightSidebarWidth,
                    minWidth: rightSidebarWidth,
                }}
            >
                {/* Toggle Button - Controls sidebar visibility */}
                <button
                    className="toggle-button"
                    onClick={() => setShowRightSidebar(!showRightSidebar)}
                >
                    {showRightSidebar ? '→' : '←'}
                </button>

                {/* Sidebar Content */}
                <div className="sidebar-content">
                    <h2>Map Information</h2>

                    {/* Statistics Panel - Displays map metrics */}
                    <div className="info-panel">
                        <h3>Statistics</h3>
                        <p>Total Points: 2,139</p>
                        <p>Total Hexcells: 177</p>
                    </div>
                </div>

                {/* Resize Handle - Enables drag-to-resize functionality */}
                <div
                    className="resize-handle left"
                    onMouseDown={() => startResizing('right')}
                />
            </div>
        </div>
    );
};

// ============================================================================
// Export Component
// Make the App component available for import by other modules
// ============================================================================
export default App;