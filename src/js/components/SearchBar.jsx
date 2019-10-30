import React, { Component } from 'react';

class SearchBar extends Component {
    constructor() {
        super();

        this.state = {
            search: ''
        }
    }

    updateInput(field, value) {
        this.setState(() => {
            return { [field]: value }
        })
    }

    render() {
        const { search } = this.state;

        return (
            <>
                <label htmlFor='#search-bar'>
                    Search:
                </label>
                <input id='#search-bar' value={search} onChange={(e) => this.updateInput('search', e.target.value)}></input>
            </>
        )
    }
}

export default SearchBar;