# # import json, requests, random
# import numpy as np
# import matplotlib as plt
# # from collections import defaultdict
# # from itertools import combinations
# import matplotlib.pyplot as plt
# import matplotlib
# import cv2

# def state2img(state, r=2048):
#     img = np.zeros((r, r, 3), dtype='uint8')
#     x0, y0, x1, y1 = state_data['bbox']
#     scale = min(r/(x1-x0), r/(y1-y0))
#     bottom = np.array([x0, y0])
#     for idx, multipoly in enumerate(state_data['shapes']):
#         for shape in multipoly:
#             array = np.array(shape[:-1])
#             array = (array - bottom) * scale
#             array = array.astype('i')
#             array = array.reshape((-1,1,2))
#             j = idx + 1
#             cv2.fillPoly(img, [array], ((j >> 16)&255, (j >> 8)&255, j&255))
#     return img

# state_path = sys.argv[1]
# out_path = sys.argv[2]
# assert state_path
# assert out_path
# with open(state_path, 'r') as f:
#     state = json.load(f)
#     img = state2img(state)
#     cv2.imwrite(out_path, img) 