import { useState } from 'react';
import { X, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { api } from './api';
export default function AuthModal({ cities, onClose, onSuccess }) {
 const [register,setRegister]=useState(false), [error,setError]=useState(''), [busy,setBusy]=useState(false);
 async function submit(e) { e.preventDefault(); setBusy(true); setError(''); try { const {user}=await api(register?'register':'login',{method:'POST',body:Object.fromEntries(new FormData(e.target))}); onSuccess(user); } catch(e){setError(e.message)} finally{setBusy(false)} }
 return <div className="modal-backdrop"><section className="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="icon close" onClick={onClose} aria-label="Close sign in"><X/></button><div className="round-mark"><UtensilsCrossed/></div><p className="eyebrow">GOOD FOOD. GREAT COMPANY.</p><h2 id="auth-title">{register?'Join the table.':'Welcome back.'}</h2><p className="muted">{register?'Save your favorites. Keep every delicious memory.':'Your next favorite meal is waiting.'}</p><form onSubmit={submit}>
 {register&&<label>Your name<input name="name" autoComplete="name" required maxLength={100}/></label>}
 <label>Email address<input name="email" type="email" autoComplete="email" required/></label><label>Password<input name="password" type="password" autoComplete={register?'new-password':'current-password'} required minLength={register?6:undefined}/></label>
 {register&&<div className="form-row"><label>City<select name="city" defaultValue="Prishtinë">{cities.map(c=><option key={c}>{c}</option>)}</select></label><label>Phone (XK)<input name="phone" type="tel" placeholder="+383 44 123 456" autoComplete="tel" required/></label></div>}
 {error&&<p className="error" role="alert">{error}</p>}<button className="primary wide" disabled={busy}>{busy?'Just a moment…':register?'Create account':'Sign in'}<ArrowRight size={18}/></button></form><p className="auth-switch">{register?'Already part of the family?':'New around here?'} <button className="text-button" onClick={()=>{setRegister(!register);setError('')}}>{register?'Sign in':'Create an account'}</button></p><button className="text-button muted" onClick={onClose}>Continue browsing as a guest</button></section></div>
}
