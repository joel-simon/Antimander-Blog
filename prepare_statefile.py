""" Remove the unneeded data for webgl viewer.
"""
import os
import sys
import cv2
import numpy as np
import json

if __name__ == '__main__':
    with open(sys.argv[1], 'r') as f:
        state = json.load(f)
        del state['shapes']
        del state['neighbors']
        del state['tile_edges']
        json.dump(state, open(sys.argv[2], 'w+'))