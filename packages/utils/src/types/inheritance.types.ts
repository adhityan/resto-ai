export type SubClass<X, Y extends X = X> = (new (...args: any[]) => Y) & // must be constructable
    Omit<X, 'prototype'>; // keep static members
