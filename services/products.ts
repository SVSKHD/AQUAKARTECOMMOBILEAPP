import axios from 'axios';
import {API_BASE_URL} from './config';


export const fetchProducts = async () => axios.get(`${API_BASE_URL}/all-products`);