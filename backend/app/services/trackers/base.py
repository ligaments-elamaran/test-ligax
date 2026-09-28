from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime


class BaseTrackerConnector(ABC):
    def __init__(self, name: str, config: Dict[str, Any]):
        self.name = name
        self.config = config

    @abstractmethod
    def fetch_items(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """
        Fetch items from the external or simulated system.
        Returns a list of dicts:
        [
            {
                "external_id": str,
                "title": str,
                "description": str,
                "category": 'shipped' | 'slipped' | 'blocked',
                "author": str,
                "url": str,
                "status": str,
                "item_metadata": dict,
                "occurred_at": datetime
            }
        ]
        """
        pass

    @abstractmethod
    def test_connection(self) -> Dict[str, Any]:
        """Verify credentials or connectivity."""
        pass
