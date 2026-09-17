import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {test,expect,vi,afterEach} from 'vitest';
import Catalog,{RestaurantMenu} from './Catalog';
afterEach(cleanup);
const restaurants=[{id:1,name:'Casa di Pasta',cuisine:'Italian',delivery_fee_cents:150,delivery_minutes:30,foods:[{id:1,name:'Margherita',category:'Pizza',price_cents:650,description:'Fresh basil'}]},{id:2,name:'Burger Theory',cuisine:'Burgers',delivery_fee_cents:100,delivery_minutes:25,foods:[]}];
test('cuisine filter shows only matching restaurants',()=>{render(<Catalog restaurants={restaurants} onSelect={vi.fn()} onFavorite={vi.fn()} isFavorite={()=>false} query="" setQuery={vi.fn()}/>);fireEvent.click(screen.getByRole('button',{name:'Burgers',exact:true}));expect(screen.getByText('Burger Theory')).toBeInTheDocument();expect(screen.queryByText('Casa di Pasta')).not.toBeInTheDocument()});
test('menu passes selected food and restaurant to cart',()=>{const add=vi.fn();render(<RestaurantMenu restaurant={restaurants[0]} onBack={vi.fn()} onFavorite={vi.fn()} isFavorite={()=>false} onAdd={add}/>);fireEvent.click(screen.getByRole('button',{name:'Add Margherita to cart'}));expect(add).toHaveBeenCalledWith(restaurants[0].foods[0],restaurants[0]);expect(screen.getByText('€6.50')).toBeInTheDocument()});
