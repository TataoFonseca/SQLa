// src/js/data/chinookSchema.js
//
// Esquema estático de la base de datos Chinook para renderizar el ERD en la pestaña "Consultar BD".
// Formato compatible con renderERD(schema) en appController.js.
//
// Cuando se implemente la importación dinámica de BDs, el backend parseará el script SQL
// y devolverá un objeto con la misma estructura { tables, fkEdges }, que se pasará directamente
// a renderERD(schema) sin modificar el renderizador.

export const chinookSchema = {
  tables: [
    {
      id: 'Artist', cols: [
        { name: 'ArtistId', type: 'INT', pk: true },
        { name: 'Name', type: 'NVARCHAR(120)', pk: false },
      ]
    },
    {
      id: 'Album', cols: [
        { name: 'AlbumId', type: 'INT', pk: true },
        { name: 'Title', type: 'NVARCHAR(160)', pk: false },
        { name: 'ArtistId', type: 'INT', pk: false, fk: 'Artist' },
      ]
    },
    {
      id: 'Track', cols: [
        { name: 'TrackId', type: 'INT', pk: true },
        { name: 'Name', type: 'NVARCHAR(200)', pk: false },
        { name: 'AlbumId', type: 'INT', pk: false, fk: 'Album' },
        { name: 'MediaTypeId', type: 'INT', pk: false, fk: 'MediaType' },
        { name: 'GenreId', type: 'INT', pk: false, fk: 'Genre' },
        { name: 'Composer', type: 'NVARCHAR(220)', pk: false },
        { name: 'Milliseconds', type: 'INT', pk: false },
        { name: 'Bytes', type: 'INT', pk: false },
        { name: 'UnitPrice', type: 'NUMERIC(10,2)', pk: false },
      ]
    },
    {
      id: 'MediaType', cols: [
        { name: 'MediaTypeId', type: 'INT', pk: true },
        { name: 'Name', type: 'NVARCHAR(120)', pk: false },
      ]
    },
    {
      id: 'Genre', cols: [
        { name: 'GenreId', type: 'INT', pk: true },
        { name: 'Name', type: 'NVARCHAR(120)', pk: false },
      ]
    },
    {
      id: 'Playlist', cols: [
        { name: 'PlaylistId', type: 'INT', pk: true },
        { name: 'Name', type: 'NVARCHAR(120)', pk: false },
      ]
    },
    {
      id: 'PlaylistTrack', cols: [
        { name: 'PlaylistId', type: 'INT', pk: false, fk: 'Playlist' },
        { name: 'TrackId', type: 'INT', pk: false, fk: 'Track' },
      ]
    },
    {
      id: 'Customer', cols: [
        { name: 'CustomerId', type: 'INT', pk: true },
        { name: 'FirstName', type: 'NVARCHAR(40)', pk: false },
        { name: 'LastName', type: 'NVARCHAR(20)', pk: false },
        { name: 'Company', type: 'NVARCHAR(80)', pk: false },
        { name: 'Address', type: 'NVARCHAR(70)', pk: false },
        { name: 'City', type: 'NVARCHAR(40)', pk: false },
        { name: 'State', type: 'NVARCHAR(40)', pk: false },
        { name: 'Country', type: 'NVARCHAR(40)', pk: false },
        { name: 'PostalCode', type: 'NVARCHAR(10)', pk: false },
        { name: 'Phone', type: 'NVARCHAR(24)', pk: false },
        { name: 'Fax', type: 'NVARCHAR(24)', pk: false },
        { name: 'Email', type: 'NVARCHAR(60)', pk: false },
        { name: 'SupportRepId', type: 'INT', pk: false, fk: 'Employee' },
      ]
    },
    {
      id: 'Employee', cols: [
        { name: 'EmployeeId', type: 'INT', pk: true },
        { name: 'LastName', type: 'NVARCHAR(20)', pk: false },
        { name: 'FirstName', type: 'NVARCHAR(20)', pk: false },
        { name: 'Title', type: 'NVARCHAR(30)', pk: false },
        { name: 'ReportsTo', type: 'INT', pk: false, fk: 'Employee' },
        { name: 'BirthDate', type: 'DATETIME', pk: false },
        { name: 'HireDate', type: 'DATETIME', pk: false },
        { name: 'Address', type: 'NVARCHAR(70)', pk: false },
        { name: 'City', type: 'NVARCHAR(40)', pk: false },
        { name: 'State', type: 'NVARCHAR(40)', pk: false },
        { name: 'Country', type: 'NVARCHAR(40)', pk: false },
        { name: 'PostalCode', type: 'NVARCHAR(10)', pk: false },
        { name: 'Phone', type: 'NVARCHAR(24)', pk: false },
        { name: 'Fax', type: 'NVARCHAR(24)', pk: false },
        { name: 'Email', type: 'NVARCHAR(60)', pk: false },
      ]
    },
    {
      id: 'Invoice', cols: [
        { name: 'InvoiceId', type: 'INT', pk: true },
        { name: 'CustomerId', type: 'INT', pk: false, fk: 'Customer' },
        { name: 'InvoiceDate', type: 'DATETIME', pk: false },
        { name: 'BillingAddress', type: 'NVARCHAR(70)', pk: false },
        { name: 'BillingCity', type: 'NVARCHAR(40)', pk: false },
        { name: 'BillingState', type: 'NVARCHAR(40)', pk: false },
        { name: 'BillingCountry', type: 'NVARCHAR(40)', pk: false },
        { name: 'BillingPostalCode', type: 'NVARCHAR(10)', pk: false },
        { name: 'Total', type: 'NUMERIC(10,2)', pk: false },
      ]
    },
    {
      id: 'InvoiceLine', cols: [
        { name: 'InvoiceLineId', type: 'INT', pk: true },
        { name: 'InvoiceId', type: 'INT', pk: false, fk: 'Invoice' },
        { name: 'TrackId', type: 'INT', pk: false, fk: 'Track' },
        { name: 'UnitPrice', type: 'NUMERIC(10,2)', pk: false },
        { name: 'Quantity', type: 'INT', pk: false },
      ]
    },
  ],

  fkEdges: [
    { source: 'Album',         target: 'Artist',    label: 'ArtistId' },
    { source: 'Track',         target: 'Album',     label: 'AlbumId' },
    { source: 'Track',         target: 'MediaType', label: 'MediaTypeId' },
    { source: 'Track',         target: 'Genre',     label: 'GenreId' },
    { source: 'Customer',      target: 'Employee',  label: 'SupportRepId' },
    { source: 'Employee',      target: 'Employee',  label: 'ReportsTo' },
    { source: 'Invoice',       target: 'Customer',  label: 'CustomerId' },
    { source: 'InvoiceLine',   target: 'Invoice',   label: 'InvoiceId' },
    { source: 'InvoiceLine',   target: 'Track',     label: 'TrackId' },
    { source: 'PlaylistTrack', target: 'Playlist',  label: 'PlaylistId' },
    { source: 'PlaylistTrack', target: 'Track',     label: 'TrackId' },
  ],
};
