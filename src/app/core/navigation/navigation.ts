import { FuseNavigationItem } from "@fuse/components/navigation";

export const userNavigation: FuseNavigationItem[] = [
    {
        type    : 'divider',
    },
    {
        id      : 'dashboard',
        title   : 'Panel',
        type    : 'group',
        icon    : 'heroicons_outline:cash',

        children: [
            {
                id   : 'dashboard.home',
                title: 'Inicio',
                type : 'basic',
                icon : 'heroicons_outline:home',
                link : 'dashboard',
                exactMatch: true,
            },
            {
                id   : 'dashboard.comunicaciones',
                title: 'Comunicaciones',
                type : 'basic',
                icon : 'heroicons_outline:document',
                link : 'dashboard/case',
                exactMatch: true,
            },
            {
                id   : 'dashboard.profile',
                title: 'Mi perfil',
                type : 'basic',
                icon : 'heroicons_outline:user-circle',
                link : 'dashboard/case',
                exactMatch: true,
            },
        ]
    },
]

export const adminNavigation: FuseNavigationItem[] = [
    {
        type    : 'divider',
    },
    {
        id   : 'dashboard.main',
        title: 'Inicio',
        type : 'basic',
        icon : 'heroicons_outline:home',
        link : 'home',
        exactMatch: true,
    },
    {
        id   : 'dashboard.lugares',
        title: 'Lugares',
        type : 'basic',
        icon : 'heroicons_outline:building-storefront',
        link : 'lugares',
        exactMatch: true,
    },
    {
        id   : 'dashboard.comuneros',
        title: 'Comuneros',
        type : 'basic',
        icon : 'heroicons_outline:users',
        link : 'comuneros',
        exactMatch: true,
    },
    {
        id   : 'dashboard.reuniones',
        title: 'Reuniones',
        type : 'basic',
        icon : 'heroicons_outline:presentation-chart-line',
        link : 'reuniones',
        exactMatch: true,
    },
    {
        id   : 'dashboard.comunicaciones',
        title: 'Comunicaciones',
        type : 'basic',
        icon : 'heroicons_outline:printer',
        link : 'announcements',
        exactMatch: true,
    },
    // {
    //     id   : 'dashboard.documentacion',
    //     title: 'Documentación',
    //     type : 'basic',
    //     icon : 'heroicons_outline:document-duplicate',
    //     link : 'dashboard',
    //     exactMatch: true,
    // },
    // {
    //     id   : 'dashboard.comunidad',
    //     title: 'Mi comunidad',
    //     type : 'basic',
    //     icon : 'heroicons_outline:cog',
    //     link : 'dashboard',
    //     exactMatch: true,
    // }
]
