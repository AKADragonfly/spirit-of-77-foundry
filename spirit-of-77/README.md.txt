# Spirit of '77 System for Foundry VTT

A complete custom system implementation for the **Spirit of '77** RPG, featuring authentic 1970s styling and comprehensive support for all game mechanics including Thangs, Sweet Rides, and the full PbtA-based roll system.

## Features

- **Authentic 1970s "Rap Sheet" Character Sheets** with police booking aesthetic
- **Complete Spirit of '77 Mechanics**: Harm system, Scars, Something Extra/Less rolling
- **Full Gear & Thangs System**: Support for Thangs, Vehicles, X-Tech, and complex equipment
- **Enhanced Roll Mechanics**: Temporary modifiers, move-specific bonuses, automated roll handling
- **Persistent Header Design**: Key character info always visible across tabs
- **Integrated Scar System**: Scar checkboxes positioned next to their corresponding stats

## Installation

1. In Foundry VTT, go to the **Game Systems** tab
2. Click **Install System** 
3. Paste the manifest URL: `[your-manifest-url-here]`
4. Click **Install**
5. Create a new world using the **Spirit of '77** system

## Credits & Attribution

This system was built using the excellent foundation provided by:

### Primary Inspiration
- **PbtA System** by [asacolips-projects](https://github.com/asacolips-projects/pbta)
  - Foundation for document structure, roll mechanics, and PbtA framework
  - License: [MIT License](https://github.com/asacolips-projects/pbta/blob/main/LICENSE)

### Reference Implementation  
- **Monsters of the Week for PbtA** by [Rangertheman](https://github.com/Rangertheman/motw-for-pbta)
  - Reference for proper PbtA system customization patterns
  - Guidance on module structure and implementation approaches

### Spirit of '77 RPG
- **Spirit of '77** RPG by [David Schirduan](https://www.technicalgrimoire.com/) and [Joshua Macy](https://jcmac83.gitlab.io/)
  - The amazing tabletop RPG that this system implements
  - All game mechanics, setting, and concepts belong to the original creators

### Technical Foundation
- **Foundry VTT** by [Foundry Gaming LLC](https://foundryvtt.com/)
  - The virtual tabletop platform this system runs on

## Development

This system started as a modification of the existing PbtA system but was rebuilt from the ground up to provide:

- Complete control over character data persistence
- Custom field implementations that were difficult to achieve as a module
- Spirit of '77 specific mechanics that required deep system integration
- Enhanced UI/UX tailored specifically for the 1970s aesthetic

### Key Design Decisions

- **Custom Actor/Item Documents**: Extended base Foundry classes while incorporating PbtA patterns
- **Persistent Header Layout**: Maintains character identification across all sheet tabs  
- **Integrated Scar System**: Scars positioned next to stats they affect for intuitive UX
- **Flexible Item System**: Supports everything from simple gear to complex Sweet Rides
- **Automated Roll Enhancement**: Handles Something Extra/Less and modifiers automatically

## File Structure

spirit-of-77/
├── system.json                 # System manifest
├── template.json              # Data model definitions
├── README.md                  # This file
├── LICENSE                    # License information
├── lang/
│   └── en.json               # English language strings
├── module/
│   ├── spirit77.mjs          # Main system initialization
│   ├── documents/
│   │   ├── actor.mjs         # Custom Actor document class
│   │   └── item.mjs          # Custom Item document class
│   ├── sheets/
│   │   ├── actor-sheet.mjs   # Character sheet implementation
│   │   └── item-sheet.mjs    # Item sheet implementation
│   └── helpers/
│       ├── config.mjs        # System configuration constants
│       └── templates.mjs     # Template preloader
├── styles/
│   └── spirit77.css         # 1970s themed styling
└── templates/
├── actor/
│   ├── actor-character-sheet.hbs
│   └── parts/
│       ├── actor-moves.hbs
│       └── actor-gear.hbs
└── item/
└── item-move-sheet.hbs

## License

This system is released under the [MIT License](LICENSE).

### Third-Party Licenses

- PbtA System components: MIT License
- Foundry VTT: [Limited License Agreement](https://foundryvtt.com/article/license/)
- Spirit of '77 RPG: Used with respect for the original creators' intellectual property

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly  
5. Submit a pull request

## Support

For issues and feature requests, please use the [GitHub Issues](https://your-repo-url/issues) page.

## Changelog

### Version 1.0.0
- Initial release
- Complete Spirit of '77 mechanics implementation
- 1970s themed character sheets
- Full Gear & Thangs system
- Enhanced roll mechanics with Something Extra/Less
- Persistent header design

---

**Note**: This is an unofficial system implementation created by fans for fans. Spirit of '77 RPG is the intellectual property of its original creators. Please support the official game by purchasing it from the creators.