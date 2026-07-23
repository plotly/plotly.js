import type { CountryRecord } from 'country-iso-search';

/**
 * Plotly-specific country records for disputed and unrecognized territories
 * that are not part of ISO 3166-1. Each entry uses an ISO3-like code in the
 * `X` range (reserved by ISO 3166-1 for user-assigned codes) so these regions
 * can be looked up alongside standard countries from `country-iso-search`.
 */
export const COUNTRIES_X: ReadonlyArray<CountryRecord> = [
    {
        iso3: 'XAC',
        iso2: '',
        m49: '',
        name: 'Aksai Chin',
        aliases: []
    },
    {
        iso3: 'XAP',
        iso2: '',
        m49: '',
        name: 'Arunachal Pradesh',
        aliases: []
    },
    {
        iso3: 'XBT',
        iso2: '',
        m49: '',
        name: 'Bir Tawil',
        aliases: []
    },
    {
        iso3: 'XHT',
        iso2: '',
        m49: '',
        name: 'Halaib Triangle',
        aliases: []
    },
    {
        iso3: 'XJK',
        iso2: '',
        m49: '',
        name: 'Jammu and Kashmir',
        aliases: []
    }
];
