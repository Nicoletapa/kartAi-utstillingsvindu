from langchain_core.tools import BaseTool
from typing import Dict, Any, Optional
import logging
import json
import math
from pydantic import Field

logger = logging.getLogger(__name__)

class SpatialAnalysisTool(BaseTool):
    """A tool to analyze spatial data from map drawings."""
    
    name: str = "spatial_analysis"
    description: str = (
        "Use this tool to interpret map drawings or location data provided by the user. "
        "The tool will provide information about the drawn shape, its location, property boundaries, "
        "and whether it complies with local regulations based on its location. "
        "It will also determine if neighbor or road authority permission is needed."
    )
    
    # Define spatial_context as a field with a default value of None
    spatial_context: Optional[Dict[str, Any]] = Field(default=None, description="Stores the spatial context from the user's drawing")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # No need to set spatial_context here, it's already defined as a field
        
    def _run(self, query: str = "") -> str:
        """
        Process the spatial data that was passed to the agent.
        
        Args:
            query: Not used directly - the spatial data is accessed from the context
        
        Returns:
            A description of the spatial data analysis
        """
        try:
            # Return the stored spatial context data from the most recent query
            if self.spatial_context is None:
                return "No spatial data is currently available. The user has not drawn anything on the map."
            
            # Format the spatial context into a readable response
            result = ["Here's what I know about the drawing on the map:"]
            
            # Get shape information
            if 'shapeType' in self.spatial_context:
                result.append(f"- Shape type: {self.spatial_context['shapeType']}")
            
            # Get property boundary relationship
            if 'isWithinProperty' in self.spatial_context:
                is_within = self.spatial_context['isWithinProperty']
                if is_within:
                    result.append("- The shape is within the property boundary.")
                else:
                    result.append("- The shape is outside the property boundary.")
                    
                    if 'distanceToProperty' in self.spatial_context and self.spatial_context['distanceToProperty'] is not None:
                        distance = self.spatial_context['distanceToProperty']
                        result.append(f"- Distance to property boundary: approximately {distance:.2f} meters.")
            
            # Get allowed area information
            if 'isWithinAllowedArea' in self.spatial_context:
                is_within_allowed = self.spatial_context['isWithinAllowedArea']
                if is_within_allowed is not None:
                    if is_within_allowed:
                        result.append("- The shape is within the allowed building area.")
                    else:
                        result.append("- The shape is outside the allowed building area.")
                        
                        # Add new decision-making logic for permissions
                        if self._determine_permission_needed():
                            permission_type, distance, entity = self._determine_permission_needed()
                            result.append(f"- Permission required: Yes, from {entity}")
                            result.append(f"- Reason: The drawing is approximately {distance:.2f} meters from {entity} boundary")
                            result.append(f"- According to regulations, you need permission from the {entity} to build in this location.")
                        else:
                            result.append("- Further analysis needed to determine exact permission requirements.")
            
            # Add property identifier if available
            if 'nearestPropertyId' in self.spatial_context and self.spatial_context['nearestPropertyId']:
                result.append(f"- Nearest property ID: {self.spatial_context['nearestPropertyId']}")
            
            # Add building size information if available
            if 'buildingSize' in self.spatial_context:
                size = self.spatial_context['buildingSize']
                result.append(f"- Estimated building size: approximately {size:.2f} square meters")
                if size < 50:
                    result.append("- Building size is under 50 square meters (may qualify for simplified permit process)")
                else:
                    result.append("- Building size is 50 square meters or more (standard permit process applies)")
            
            # Additional context about regulations
            if 'isWithinProperty' in self.spatial_context and 'isWithinAllowedArea' in self.spatial_context:
                is_within = self.spatial_context['isWithinProperty']
                is_within_allowed = self.spatial_context['isWithinAllowedArea']
                
                if is_within and is_within_allowed:
                    result.append("- This location appears suitable for building according to property boundaries and allowed areas.")
                elif is_within and is_within_allowed is False:
                    result.append("- Although within your property, this location may be subject to restrictions according to the municipal plan.")
                    
                    # Add reason for restriction based on additional data
                    if 'restriccionReasons' in self.spatial_context:
                        for reason in self.spatial_context['restriccionReasons']:
                            result.append(f"  • {reason}")
                    
                elif not is_within:
                    result.append("- Building outside your property boundaries is generally not permitted.")
            
            return "\n".join(result)
            
        except Exception as e:
            logger.error(f"Error in SpatialAnalysisTool: {e}", exc_info=True)
            return "I encountered an error while analyzing the spatial data."
    
    def _determine_permission_needed(self) -> Optional[tuple]:
        """
        Determine what kind of permission is needed based on the drawing location.
        
        Returns:
            Tuple with (permission_type, distance, entity) or None if indeterminate
        """
        if not self.spatial_context:
            return None
            
        # Check distance to neighbor property
        if 'distanceToNeighborProperty' in self.spatial_context and self.spatial_context['distanceToNeighborProperty'] is not None:
            neighbor_distance = self.spatial_context['distanceToNeighborProperty']
            if neighbor_distance < 4.0:  # 4 meters is common threshold for neighbor permission
                return ('neighbor', neighbor_distance, 'neighbor')
                
        # Check distance to road
        if 'distanceToRoad' in self.spatial_context and self.spatial_context['distanceToRoad'] is not None:
            road_distance = self.spatial_context['distanceToRoad']
            if road_distance < 15.0:  # Example: road authority permission needed within 15m of public road
                return ('road', road_distance, 'road authority')
                
        # Default case - general permission may be needed
        return None
    
    async def _arun(self, query: str = "") -> str:
        """Async implementation of the spatial analysis tool."""
        return self._run(query)
        
    def update_spatial_context(self, spatial_data: Dict[str, Any]) -> None:
        """
        Update the tool with the latest spatial data from a drawing.
        
        Args:
            spatial_data: Dictionary containing spatial analysis results
        """
        # Now we can safely update the field
        self.spatial_context = spatial_data
        
        # Calculate additional spatial properties if not already present
        if self.spatial_context and 'shapeType' in self.spatial_context:
            if 'buildingSize' not in self.spatial_context and self.spatial_context['shapeType'] in ['Polygon', 'Rectangle']:
                # Approximate building size calculation if coordinates are available
                if 'coordinates' in self.spatial_context:
                    self.spatial_context['buildingSize'] = self._calculate_polygon_area(self.spatial_context['coordinates'])
            
            # Determine distances to important features if not provided
            if 'isWithinAllowedArea' in self.spatial_context and not self.spatial_context['isWithinAllowedArea']:
                # This would be filled with real data in production
                if 'distanceToNeighborProperty' not in self.spatial_context:
                    self._detect_proximity_to_neighbors()
                if 'distanceToRoad' not in self.spatial_context:
                    self._detect_proximity_to_roads()
                    
                # Add reasons for restrictions based on location analysis
                self._determine_restriction_reasons()
        
        logger.info(f"Spatial context updated with: {json.dumps(spatial_data, default=str)}")
        
    def _detect_proximity_to_neighbors(self):
        """
        Detect proximity to neighboring properties.
        In a real implementation, this would use GIS data to calculate actual distances.
        For now, we'll use a dummy implementation.
        """
        # Example implementation - replace with actual GIS calculations
        if self.spatial_context.get('distanceToProperty', 100) < 2.0:
            # If very close to property boundary, likely close to neighbor
            self.spatial_context['distanceToNeighborProperty'] = max(0.1, self.spatial_context.get('distanceToProperty', 0) - 0.1)
            self.spatial_context['neighborPropertyId'] = "Example Neighbor"
        
    def _detect_proximity_to_roads(self):
        """
        Detect proximity to roads.
        In a real implementation, this would use GIS data to calculate actual distances.
        For now, we'll use a dummy implementation.
        """
        # Example implementation - replace with actual GIS calculations
        if self.spatial_context.get('distanceToProperty', 100) < 10.0:
            # If close to property boundary, might be close to a road
            self.spatial_context['distanceToRoad'] = self.spatial_context.get('distanceToProperty', 0) + 2.0
            self.spatial_context['roadType'] = "Municipal Road"
    
    def _determine_restriction_reasons(self):
        """
        Determine reasons for building restrictions.
        """
        if not self.spatial_context.get('isWithinAllowedArea', True):
            reasons = []
            
            # Distance to neighbor property
            if 'distanceToNeighborProperty' in self.spatial_context and self.spatial_context['distanceToNeighborProperty'] < 4.0:
                reasons.append(f"Too close to neighbor's property (only {self.spatial_context['distanceToNeighborProperty']:.2f}m, minimum 4m required)")
                
            # Distance to road
            if 'distanceToRoad' in self.spatial_context and self.spatial_context['distanceToRoad'] < 15.0:
                reasons.append(f"Too close to road (only {self.spatial_context['distanceToRoad']:.2f}m from {self.spatial_context.get('roadType', 'road')})")
                
            # Building size
            if 'buildingSize' in self.spatial_context and self.spatial_context['buildingSize'] > 200:
                reasons.append(f"Building size exceeds maximum allowed in this area ({self.spatial_context['buildingSize']:.2f}㎡)")
                
            # Store the reasons
            if reasons:
                self.spatial_context['restriccionReasons'] = reasons
    
    def _calculate_polygon_area(self, coordinates) -> float:
        """
        Calculate the approximate area of a polygon in square meters.
        Very simplified implementation - a real system would use proper GIS calculations.
        
        Args:
            coordinates: List of polygon coordinates
            
        Returns:
            Estimated area in square meters
        """
        # This is a placeholder - real implementation would use a GIS library
        # to calculate actual area from coordinates
        try:
            # Simple rectangular approximation for demo purposes
            if isinstance(coordinates, list) and len(coordinates) >= 4:
                # Get min/max coordinates to approximate a bounding box
                lats = [coord[1] for coord in coordinates if isinstance(coord, list) and len(coord) >= 2]
                lngs = [coord[0] for coord in coordinates if isinstance(coord, list) and len(coord) >= 2]
                
                if lats and lngs:
                    # Rough approximation of meters per degree at this latitude
                    # (this is very approximate and would be done properly with a GIS library)
                    meters_per_lat = 111320  # meters per degree latitude (approximate)
                    meters_per_lng = 111320 * math.cos(math.radians(sum(lats) / len(lats)))  # meters per degree longitude
                    
                    lat_diff = abs(max(lats) - min(lats)) * meters_per_lat
                    lng_diff = abs(max(lngs) - min(lngs)) * meters_per_lng
                    
                    return lat_diff * lng_diff
            
            # Fallback estimate based on number of coordinates
            return 25.0  # default 25 square meters as fallback
            
        except Exception as e:
            logger.error(f"Error calculating polygon area: {e}")
            return 25.0  # default fallback