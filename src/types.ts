/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  duration: string;
  description: string;
  features?: string[];
  popular?: boolean;
}

export type ServiceCategory = 'bridal' | 'hair' | 'skin' | 'essentials';

export interface BookingDetails {
  name: string;
  phone: string;
  date: string;
  time: string;
  selectedServices: string[];
  notes?: string;
  bridalPackageType?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  text: string;
  category: string;
  badge: 'Verified Bride' | 'VIP Client' | 'Frequent Guest' | 'Celebrity Styling';
  date: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  tag: string;
}

export interface InstagramPost {
  id: string;
  image: string;
  likes: string;
  comments: string;
  caption: string;
  daysAgo: number;
}
